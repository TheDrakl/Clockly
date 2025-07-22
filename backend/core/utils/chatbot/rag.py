from typing import Optional, Any, Union
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import WebBaseLoader, PyMuPDFLoader, UnstructuredWordDocumentLoader, TextLoader, UnstructuredMarkdownLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from django.conf import settings
from core.models import MyDocument
from bs4 import BeautifulSoup
import numpy as np
from urllib.parse import urlparse, urljoin
import requests
import os
from openai import OpenAI
from core.utils.chatbot.event_chain import tool_schemas

# Add for JS rendering
try:
    from requests_html import HTMLSession
except ImportError:
    HTMLSession = None
    print("[ERROR] requests-html is not installed. Run 'pip install requests-html' to enable JS rendering.")

"""
RAG (Retrieval-Augmented Generation) utilities for embedding, chunking, retrieval, and prompt sending.
"""

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class CustomWebBaseLoader(WebBaseLoader):
    def _scrape(self, url: str, parser: Union[str, None] = None, bs_kwargs: Optional[dict] = None) -> Any:
        html_content = super()._scrape(url, parser)
        # Extract all visible text from the entire page
        texts = html_content.find_all(string=True)
        visible_texts = [t.strip() for t in texts if t.parent.name not in ['style', 'script', 'head', 'title', 'meta', '[document]'] and t.strip()]
        page_text = '\n'.join(visible_texts)
        if not page_text:
            print(f"[WARNING] No visible text found for {url}.")
        return BeautifulSoup(page_text, "html.parser", **(bs_kwargs or {}))

def is_internal(url, root_domain="greencarlane.com"):
    return urlparse(url).netloc.endswith(root_domain)

def bootstrap_docs_build_urls():
    root_url = "https://greencarlane.com/" # Update URL if needed
    print(f"[DEBUG] Fetching root URL: {root_url}")
    if HTMLSession is None:
        print("[ERROR] requests-html is not installed. Cannot extract JS-rendered links.")
        return []
    session = HTMLSession()
    r = session.get(root_url)
    print("[DEBUG] Rendering JavaScript...")
    r.html.render(timeout=20)
    links = r.html.absolute_links
    print(f"[DEBUG] Found {len(links)} links after JS rendering.")
    return list(links)

def get_loader(file_path):
    ext = file_path.lower().split('.')[-1]
    match ext:
        case 'pdf':
            return PyMuPDFLoader(file_path)
        case 'docx':
            return UnstructuredWordDocumentLoader(file_path)
        case 'txt':
            return TextLoader(file_path)
        case 'md':
            return UnstructuredMarkdownLoader(file_path)
        case _:
            return None

def run_bootstrap():
    urls = bootstrap_docs_build_urls()
    print("[DEBUG] URLs to process:", urls)
    all_documents = []
    for url in urls:
        if not is_internal(url):
            print(f"[DEBUG] Skipping external URL: {url}")
            continue
        print(f"[DEBUG] Loading: {url}")
        loader = CustomWebBaseLoader(url)
        try:
            docs = loader.load()
            print(f"[DEBUG] Docs loaded from {url}: {len(docs)}")
        except Exception as e:
            print(f"[ERROR] Failed to load {url}: {e}")
            docs = []
        all_documents.extend(docs)
    print(f"[DEBUG] Total documents loaded: {len(all_documents)}")
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=1000, chunk_overlap=0)
    splits = splitter.split_documents(all_documents)
    print(f"[DEBUG] Total splits: {len(splits)}")
    embeddings_function = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
    for chunk in splits:
        source = chunk.metadata.get('source', '')
        content = chunk.page_content
        if MyDocument.objects.filter(source=source, content=content).exists():
            continue
        embedding = embeddings_function.embed_documents([content])[0]
        MyDocument.objects.create(
            embedding=embedding,
            source=source,
            content=content
        )
    # TODO: For deeper crawling, recursively extract and process links from each internal page.
    return splits

def load_and_embed(file_path):
    if MyDocument.objects.filter(source=file_path).exists():
        return f'File already loaded'
    loader = get_loader(file_path)
    if loader is None:
        return f'Skipped unsupported file type: {file_path}'
    documents = loader.load()
    texts = [doc.page_content for doc in documents]
    embeddings_function = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
    embeddings = embeddings_function.embed_documents(texts)
    for embedding, document in zip(embeddings, documents):
        MyDocument.objects.create(
            embedding=embedding,
            source=file_path,
            content=document.page_content
        )
    return f'File was loaded successfully: {file_path}'

def load_and_embed_all(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            print(f"Processing: {filename}")
            result = load_and_embed(file_path)
            print(result)

def cosine_similarity(vec1, vec2):
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def get_relevant_chunks(user_query, top_k=5):
    embedding_model = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
    query_embedding = embedding_model.embed_query(user_query)
    all_chunks = MyDocument.objects.all()
    similarities = []
    for chunk in all_chunks:
        if chunk.embedding is None or len(chunk.embedding) == 0:
            continue
        score = cosine_similarity(query_embedding, chunk.embedding)
        similarities.append((score, chunk))
    top_chunks = sorted(similarities, key=lambda x: x[0], reverse=True)[:top_k]
    return [chunk for _, chunk in top_chunks]

def send_prompt(messages):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=300,
        tools=tool_schemas,
        tool_choice="auto",
    )
    return response.choices[0].message.content 