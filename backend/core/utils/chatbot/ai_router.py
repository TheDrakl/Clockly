from .event_chain import process_calendar_request
from .rag import get_relevant_chunks, send_prompt

"""
Main AI router: decides whether to use event extraction or RAG for a given user input.
"""

def handle_user_input(user_input: str, user: object) -> str:
    """
    Routes user input to either the event extraction chain or RAG, depending on intent.
    Returns the assistant's response as a string.
    """
    # Try event extraction chain first
    event_result = process_calendar_request(user_input, user=user)
    if event_result is not None:
        return event_result

    # Otherwise, use RAG for general Q&A
    relevant_chunks = get_relevant_chunks(user_input, top_k=5)
    context = "\n\n".join(chunk.content for chunk in relevant_chunks)
    system_message = {
        "role": "system",
        "content": (
            "You are a helpful assistant for Clockly. Use the following context to answer the user's question. "
            "If the answer is not in the context, say you don't know."
        )
    }
    user_message = {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {user_input}"}
    answer = send_prompt([system_message, user_message])
    return answer 