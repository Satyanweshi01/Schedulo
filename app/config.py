class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    secret_key = "sejfaofidsfsdfdfosdif" # csrf token for the form