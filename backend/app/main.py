from fastapi import FastAPI
import os

print("--- HELLO WORLD STARTUP ---")
print(f"DEBUG: CWD IS {os.getcwd()}")
print(f"DEBUG: LISTDIR IS {os.listdir('.')}")

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "okay", "message": "The server is alive!"}

@app.get("/")
def root():
    return {"message": "Welcome to the Spotify Clone API!"}
