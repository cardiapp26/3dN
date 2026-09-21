# Cranialis

Kafa çiftleri ve nörolojik innervasyon stüdyosu. 3D sinir yolları, kas/organ innervasyonu, atlas levhaları, MR/BT kesit paneli.

## Coolify

1. Repoyu Coolify’de **Dockerfile** build pack ile bağlayın (`https://github.com/cardiapp26/3dN.git`).
2. **Dockerfile Location:** `/Dockerfile`
3. **Ports Exposes:** `8080`  
   Konteyner `0.0.0.0:8080` dinler. Coolify reverse proxy bu iç porta yönlendirir; domain 80/443 üzerinden açılır.
4. **Healthcheck Path:** `/`
5. Ortam değişkeni zorunlu değil. Coolify `PORT` atarsa imaj onu kullanır (varsayılan `8080`).

| Ayar | Değer |
|---|---|
| Build Pack | Dockerfile |
| Port | 8080 |
| Host | 0.0.0.0 |
| Start | `node .output/server/index.mjs` |
| Nitro preset | `node-server` (Dockerfile içinde) |

Compose ile deploy: `docker-compose.yml` — servis adı `cranialis`, iç port `8080`.

## Yerel imaj

```bash
docker compose up --build
```
