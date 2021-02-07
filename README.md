# API Registro Elettronico

*Read this in other languages: [English](README.en-US.md), [Italiano](README.md).*

## Requisiti
- [`Node.js`](https://nodejs.org/)
- [`PostgreSQL`](https://www.postgresql.org/)

## Primi passi

### Crea il DB
Usa [`schema.sql`](schema.sql) per creare le tabelle necessarie.

### Crea il primo utente AMMINISTRATORE
Nella tabella `users` aggiungi una nuova riga con tutti i dati necessari ed inserisci nel campo `type` il valore `admin`.

Per il campo `password` usa la CLI di Node.js per ottenere la hash della password con questo comando:
```javascript
require("bcrypt").hashSync("PASSWORD", 15)
```
Sostituisci `PASSWORD` con una password forte per prevenire accessi non autorizzati.\
__COPIA SOLTANTO LA STRINGA ALL'INTERNO DELLE VIRGOLETTE__

### Imposta le variabili di ambiente
Crea un file chiamato `.env` e imposta le seguenti variabili:

- `DATABASE_URL`:
    L'URL usato per la connessione al DB\
    Utilizza questo formato: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`
    e sostituisci `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` e `SCHEMA` in base alla configurazione del tuo DB.

### Installa le dipendenze
Esegui `npm i`.