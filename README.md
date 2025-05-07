# Catinder - L'application de rencontres pour les amoureux des chats

Catinder est une application de type Tinder mais dédiée aux chats à adopter. Elle permet aux utilisateurs de parcourir des profils de chats disponibles à l'adoption, de les "liker" et de consulter leurs informations détaillées.

## Fonctionnalités

- 🐱 Interface de swipe façon Tinder pour découvrir des chats à adopter
- 👍 Système de likes pour marquer vos chats préférés
- 👤 Inscription et connexion des utilisateurs
- 🔍 Affichage détaillé des informations sur chaque chat
- 📱 Responsive design pour une utilisation mobile et desktop

## Prérequis

- Python 3.8 ou supérieur
- MySQL Server
- Un navigateur web moderne

## Installation


1. **Installez les dépendances**

```bash
pip install -r requirements.txt
```

5. **Configurez la base de données MySQL**

- Créez une base de données nommée `Catinder`
- Importez les fichiers SQL pour créer les tables:

```bash
mysql -u root -p catinder < catinder.sql
```

6. **Lancez l'application**

```bash
python app.py
```

7. **Accédez à l'application dans votre navigateur**

Ouvrez votre navigateur et accédez à l'adresse:
```
http://localhost:5000
```

## Configuration de la base de données

Si vous devez modifier les paramètres de connexion à la base de données, modifiez la fonction `get_db_connection()` dans le fichier `app.py`:

```python
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  
        user="root",       
        password="",       
        database="catinder" 
    )
```

## Alimenter la base de données avec des chats

Pour peupler la base de données avec des profils de chats, vous pouvez utiliser le script de scraping inclus:

```bash
python scraping.py
```

Ce script récupère des informations sur des chats disponibles à l'adoption depuis le site secondechance.org.

## Structure du projet

- `app.py` - L'application principale Flask
- `scraping.py` - Script pour récupérer des données de chats
- `static/` - Contient les fichiers CSS et JavaScript
  - `css/` - Les fichiers de style
  - `js/` - Les fichiers JavaScript
- `templates/` - Les templates HTML
- `catinder.sql` - Structure de la base de données pour les chats
- `users.sql` - Structure de la base de données pour les utilisateurs

## Fonctionnement de l'application

1. Les utilisateurs doivent s'inscrire ou se connecter
2. Sur la page principale, les utilisateurs peuvent swiper des chats (à gauche pour passer, à droite pour liker)
3. Les utilisateurs peuvent consulter leurs chats likés dans l'onglet "Mes Likes"
4. En cliquant sur un chat, les utilisateurs peuvent voir plus de détails et accéder à son annonce complète



