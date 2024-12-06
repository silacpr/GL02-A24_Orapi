# Projet SRYEM par Orapi

## Description

Projet GL02 - Phase 2 : Implémentation du sujet B par l'équipe Orapi. Cahier des charges fourni par l'équipe Tricode.

- [Cahier des charges](/doc/cahier_des_charges.pdf)
- [Sujet initial](/doc/sujet.pdf)

Ce logiciel propose des implémentations pour les spécifications fonctionnelles suivantes dont la description détaillée est disponible dans le [Cahier des charges](/doc/cahier_des_charges.pdf): 

- SPEC_1 : Composition des tests au format GIFT
- SPEC_2 : Visualisation de questions
- SPEC_3 : Recherche et sélection de questions
- SPEC_4 : Vérification de la conformité des données
- SPEC_5 : Visualisation du profil d’un examen GIFT
- SPEC_6 : Histogramme des types de questions
- SPEC_7 : Comparaison de profils d’examen
- SPEC_8 : Simulation de passage de test et bilan
- SPEC_9 : Génération de fichier VCard pour l’enseignant

## Instructions pour le lancement du projet

### Pré-requis

- Version récente LTS de Node.js
- Gestionnaire de paquets `npm`

### Installation et lancement

Assurez-vous d'avoir Node.js installé, puis :

```bash
# installation des dépendances
npm install
```

```bash
# accès à la documentation du programme
node main.cjs --help
```

## Utilisation du logiciel

### Utilisation des commandes

Ce logiciel utilise le framework Caporal et s'exécute en ligne de commande.

```bash
# exemple d'utilisation d'une commande
node main.cjs find --id "U7 p76 GR2.5 Relative clauses"
Found 1 question matching your query.

-----
TITLE: U7 p76 GR2.5 Relative clauses
BODY: The old men directed us to a small hotel, {~when~=where~whom~whose~why} we spent the night.
-----
```

Pour les commandes longues à écrire, des exemples sont fournis:

- [commande generate](/exemples/generate.sh)
- [commande validate](/exemples/validate.sh)

### Données

Pour toute commande utilisant l'ID d'un fichier gift, cet ID doit être de la forme `fileName.gift` et le fichier doit être rangé dans le dossier [data](/data).

Toutes les données fournies pour ce projet sont dans le dossier [data](/data).

## Auteurs

Projet réalisé par l'équipe ORAPI composée de **Raphaël WEIS**, **Hugo ROBIC**, **Corentin BRANCHUT**.