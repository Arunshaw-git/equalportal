import joblib
import os
import sys

# get the absolute path relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "./post_classifier_model.pkl")
vectorizer_path = os.path.join(BASE_DIR, "./tfidf_vectorizer.pkl")

# load model and vectorizer
model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

def clean_text(text):
    import re, string
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\d+", "", text)
    text = text.strip()
    return text

def predict_from_text(text):
    from sklearn.linear_model import LogisticRegression
    text_clean = clean_text(text)
    X = vectorizer.transform([text_clean])
    label = model.predict(X)[0]
    proba = model.predict_proba(X).max()

    return label, proba

if __name__ == "__main__":
    post_text = sys.argv[1]
    label, proba = predict_from_text(post_text)
    # Convert 1/0 to True/False
    label_bool = True if label == 1 else False
    print(f"{label_bool},{proba}")
