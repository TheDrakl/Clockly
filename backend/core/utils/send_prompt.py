from openai import OpenAI
import os


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_gpt_response(messages):
    # print(f"Sending rq to AI with that message: " + messages)
    response = client.chat.completions.create(
        model="gpt-4o", messages=messages, temperature=0.7, max_tokens=300
    )
    return response.choices[0].message.content
