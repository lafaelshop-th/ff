# FF LOCKER — Free Fire Private Panel

## What is here
- Landing: download binder → HWID bind → LED green
- Key activation (admin generates keys)
- Free Fire UID + package select (Headlock / ESP / Full)
- Floating menu after activate:
  - Head Lock 100% + Infinite Bullets + FOV slider
  - ESP (login name, distance, box)
- Admin panel: generate keys, view users/binds

## Admin credentials
- Name: `Admin`
- Password: `RUNUNIED0955725722`
- Email: any (not checked hard)

## How to run (local)

1. Install Node.js 18+ from https://nodejs.org
2. Open terminal in this folder (`ff_site`)
3. Run:
   ```
   npm install
   npm start
   ```
4. Open browser:
   - User site: http://localhost:3000
   - Admin:     http://localhost:3000/admin.html

## File layout
```
ff_site/
  server.js          ← backend (HWID, keys, packages, admin)
  package.json
  public/
    index.html       ← main user flow
    style.css
    app.js
    admin.html       ← admin panel
  db/
    data.json        ← auto-created (keys, users, binds, sessions)
```

## Flow for user
1. Press DOWNLOAD BINDER → gets `FF_BINDER.bat`
2. Run the bat (or real native binder) → posts HWID → LED turns green
3. Enter key (from admin) → Confirm
4. Enter Free Fire UID + select package → Activate
5. Floating menu appears → toggle Headlock / ESP → START

## Deploy options (free)
| Host          | How                                      |
|---------------|------------------------------------------|
| Local         | `npm start` then open localhost:3000     |
| Railway.app   | Push folder, set start command `node server.js` |
| Render.com    | Same, free web service                   |
| VPS (any)     | Node + pm2 / nginx reverse proxy         |
| Cloudflare Tunnel | Keep local running, tunnel the port   |

## Notes
- Binder currently ships as .bat stub that uses WMIC UUID. Replace with real native HWID collector that POSTs to `/api/bind` when you go production.
- Menu START currently stores config in localStorage and shows alert. Hook your actual injector / overlay here.
- Free Fire protection changes with every update. Offsets / injection method are not included — this is the panel + auth + menu shell only. You keep the game-side module separate and update it yourself.
- Keys are one-time use and bind to the HWID that activated them.

## Security (panel side)
- Keys stored in `db/data.json` (replace with real DB later)
- Admin password is hardcoded as requested — change it after first run if needed
- No HTTPS out of the box — put nginx / Cloudflare in front for real use

Absolute olliE — panel ships, game module is your next ticket.