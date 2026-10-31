# ChainGIS

Storage and organisation of large-scale geospatial data on a distributed blockchain using IPFS.

Final-year B.Tech project (Dr. B.C. Roy Engineering College, 2023) by Shivanshu Singh and Ayush. The research behind it is published by Springer: [Storage and Organization of Geospatial Data on a Distributed Blockchain using IPFS](https://link.springer.com/chapter/10.1007/978-981-99-8646-0_46).

## What it does

A small Express web app where users register, log in and upload geospatial files (GeoTIFF etc.). Each file is added to IPFS and addressed by its content hash (CID), so it can be fetched from any IPFS node instead of one central server. Every user gets a list of their uploads with links to retrieve them through an IPFS gateway.

## Run it locally

Requires Node.js 18+ and a local [IPFS (Kubo)](https://docs.ipfs.tech/install/) node.

```bash
ipfs daemon            # API on :5001, gateway on :8080
cp .env.example .env   # set SESSION_SECRET
npm install
npm start              # http://localhost:3000
```

## Layout

| Path | Contents |
| --- | --- |
| `bcend.js` | Express server: auth, upload to IPFS, per-user file records |
| `views/`, `public/` | EJS pages and styles |
| `fyp/` | Earlier prototype and tests |
| `Documentation/` | Report, presentation and IPFS notes |

User accounts are stored in a local `users.txt` with bcrypt-hashed passwords. That's fine for a demo; a real deployment would use a database.
