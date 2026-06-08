# DevSnips 🔧

> Gestor personal de snippets de código. Angular + Tailwind + Neon Data API + Neon Auth + Netlify.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 22, Tailwind CSS, SCSS |
| Base de datos | Neon PostgreSQL (serverless) |
| API | Netlify Functions + Neon Data API |
| Auth | Neon Auth (JWT) |
| Deploy | Netlify |

## Requisitos

- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)
- Una cuenta en [Neon](https://neon.tech)
- Una cuenta en [Netlify](https://netlify.com)

## Setup Local

```bash
# Clonar
git clone https://github.com/cristiancode-hermes/devsnips.git
cd devsnips

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Neon

# Iniciar servidor de desarrollo
npm start
```

## Variables de Entorno (Netlify)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL |

## Base de Datos

Ejecutar `schema.sql` en el SQL Editor de Neon para crear las tablas.

```bash
# O desde CLI si tienes psql:
psql "$DATABASE_URL" -f schema.sql
```

## Deploy

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login y deploy
netlify login
netlify deploy --prod
```

## Funcionalidades

- ✅ Guardar snippets con título, código, lenguaje y tags
- ✅ Ver y buscar snippets
- ✅ Editar y eliminar snippets
- ✅ Autenticación con Google/GitHub (Neon Auth)
- ✅ Diseño responsive modo oscuro
- ✅ Código con resaltado de sintaxis (próximamente)
