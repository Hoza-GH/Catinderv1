from flask import Flask, jsonify, request, render_template, send_from_directory, redirect, url_for, session, flash
import mysql.connector
import os
from flask_cors import CORS
import hashlib
import re
from functools import wraps

app = Flask(__name__, static_folder='static')
app.secret_key = 'catinder_secret_key_12345'  # Clé pour la gestion des sessions
CORS(app)  # Activer CORS pour permettre les requêtes depuis le frontend

# Configuration de la base de données
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="Catinder"
    )

# Fonction pour vérifier si l'utilisateur est connecté
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Fonction pour hasher le mot de passe
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Routes pour l'authentification
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation des données
        if not username or not password:
            return render_template('register.html', error="Tous les champs sont requis")
        
        if password != confirm_password:
            return render_template('register.html', error="Les mots de passe ne correspondent pas")
        
        
        # Vérification que le nom d'utilisateur n'est pas déjà pris
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return render_template('register.html', error="Ce nom d'utilisateur est déjà utilisé")
        
        # Création du nouvel utilisateur
        hashed_password = hash_password(password)
        
        try:
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
            conn.commit()
            user_id = cursor.lastrowid
            
            # Connexion automatique après inscription
            session['user_id'] = user_id
            session['username'] = username
            
            cursor.close()
            conn.close()
            
            return redirect(url_for('index'))
            
        except mysql.connector.Error as err:
            cursor.close()
            conn.close()
            return render_template('register.html', error=f"Erreur lors de l'inscription: {err}")
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            return render_template('login.html', error="Tous les champs sont requis")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        hashed_password = hash_password(password)
        
        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, hashed_password))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error="Nom d'utilisateur ou mot de passe incorrect")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Route principale 
@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/api/cats')
@login_required
def get_cats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Récupérer l'ID de l'utilisateur connecté
    user_id = session.get('user_id')
    
    cursor.execute("""
        SELECT c.* FROM chats c
        LEFT JOIN likes l ON c.id = l.cat_id AND l.user_id = %s
        WHERE l.id IS NULL
        LIMIT 20
    """, (user_id,))
    
    cats = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(cats)

@app.route('/api/like', methods=['POST'])
@login_required
def like_cat():
    data = request.json
    user_id = session.get('user_id')
    cat_id = data.get('cat_id')
    
    if not cat_id:
        return jsonify({"success": False, "message": "ID du chat manquant"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO likes (user_id, cat_id)
            VALUES (%s, %s)
        """, (user_id, cat_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Chat aimé avec succès!"})
        
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": str(err)}), 500

@app.route('/api/likes')
@login_required
def get_likes():
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT c.* FROM chats c
        JOIN likes l ON c.id = l.cat_id
        WHERE l.user_id = %s
        ORDER BY l.created_at DESC
    """, (user_id,))
    
    liked_cats = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(liked_cats)

@app.route('/api/user')
@login_required
def get_user():
    return jsonify({
        "id": session.get('user_id'),
        "username": session.get('username')
    })

if __name__ == '__main__':
    app.run(debug=True)