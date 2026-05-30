from app import create_app
# eta ekta app engine sob kichu shuru korche
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
