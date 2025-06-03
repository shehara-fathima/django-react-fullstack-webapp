# helpers.py
def generate_improvement_prompt(sessions):
    joined_texts = "\n\n---\n\n".join([s["transcription"] for s in sessions])
    return f"""
    You are an expert communication coach. Analyze the following conversation transcripts over time.

    {joined_texts}

    Provide a concise summary on how the speaker's communication has improved 
    Also give constructive tips for further improvement.

    Keep it under 50 words. Output in plain text.
    """
