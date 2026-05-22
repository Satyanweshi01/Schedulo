from flask import Flask
from blueprints.editor.editor import editor_bp # importing the editor blueprint object

app = Flask(__name__)
app.register_blueprint(editor_bp, url_prefix = "/editor") # registering the editor blue print object

@app.route("/")
def intro():
    return "Welcome to Schedulo\n Go to /editor for main editor page"

if __name__ == '__main__':
    app.run(debug=True)