from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Load once at startup
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Create inference pipeline
local_chat = pipeline("text-generation", model=model, tokenizer=tokenizer, device=-1)  # CPU only


def local_analyze_speech(text, context=None):
    prompt = f"""You are a coach helping someone improve their communication.
Context: {context}
Speech: {text}
How did they do? Give feedback."""

    result = local_chat(prompt, max_new_tokens=200, do_sample=True, temperature=0.7)[0]['generated_text']
    return result.replace(prompt, "").strip()  # Remove prompt prefix
