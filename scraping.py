import requests
from bs4 import BeautifulSoup
import mysql.connector

# Connexion à MySQL
conn = mysql.connector.connect(
    host="localhost",  # Adresse du serveur MySQL
    user="root",  # Utilisateur MySQL
    password="",  # Mot de passe MySQL
    database="Catinder"  # Nom de la base de données
)
cursor = conn.cursor()
conn.commit()


print("Début du scraping...")

page = 1  # Débute à la première page
all_annonces = []

while page < 25:
    url = f"https://www.secondechance.org/animal/adopter-un-chat/{page}"
    print(f"Récupération de la page {page}...")

    response = requests.get(url)

    if response.status_code == 200:
        print("Page récupérée avec succès !")

        soup = BeautifulSoup(response.text, 'html.parser')

        annonces = soup.find_all("div", class_="block overflow-hidden border-2 h-full p-2 bg-white text-left shadow-lg")

        for annonce in annonces:
            # Récupération du nom de l'animal
            nom = annonce.select_one("h3").text.strip() if annonce.select_one("h3") else "Nom inconnu"

            # Récupération de l'image
            image_tag = annonce.select_one("img")
            image_url = image_tag["src"] if image_tag else "Pas d'image"

            # Récupération du lien vers l'annonce
            lien_tag = annonce.select_one("a")
            lien = lien_tag["href"] if lien_tag else "Pas de lien"

            # Récupération race et âge
            raceAge = annonce.select_one("p", class_="open-sans text-sm text-gray-dark-sc md:text-xs lg:text-sm pb-2 px-4")
            raceAge = raceAge.text.strip() if raceAge else "inconnu"

            # --- 🆕 Récupération des détails ---
            description = "Non disponible"
            autres_images = []

            if lien:
                # Vérifie si le lien commence déjà par http:// ou https://
                if not lien.startswith("http://") and not lien.startswith("https://"):
                    full_url = f"https://www.secondechance.org{lien}"
                else:
                    full_url = lien

                detail_response = requests.get(full_url)

                if detail_response.status_code == 200:
                    detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

                    # Description (souvent dans un <div> spécifique)
                    desc_div = detail_soup.find("main", class_="ccontainer editorialcontent relative flex flex-col gap-4 pb-12 lg:pb-20 lg:pt-0")
                    if desc_div:
                        description = desc_div.get_text(separator=" ", strip=True)

                    # Autres images (miniatures ou galeries)
                    gallery_imgs = detail_soup.find_all("img")
                    for img in gallery_imgs:
                        src = img.get("src")
                        if src and src.endswith(".jpg") and src != image_url:
                            autres_images.append(src)

                else:
                    print(f"Erreur de chargement de la page de détail : {full_url}")

            # --- Insertion en base de données ---
            cursor.execute("""
                INSERT INTO chats (nom, race_age, image_url, lien, description, autres_images)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (nom, raceAge, image_url, lien, description, ', '.join(autres_images)))

            conn.commit()

            all_annonces.append({
                "Nom": nom,
                "Image": image_url,
                "Lien": lien,
                "raceAge": raceAge,
                "Description": description,
                "AutresImages": autres_images,
                "Page": page
            })
    else:
        print(f"Échec de la requête. Code HTTP : {response.status_code}")

    page += 1

# Fermeture de la connexion
cursor.close()
conn.close()

print(f"{len(all_annonces)} annonces insérées dans la base de données.")
