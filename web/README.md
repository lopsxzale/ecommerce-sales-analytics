# Site (Next.js)

Front-end estático do projeto. Os dados vêm de `src/data/*.json`, gerados por `python -m src.pipeline` na raiz do repositório.

```bash
npm install
npm run dev     # http://localhost:3000/pt/
npm run build   # export estático em out/
```

- Textos (PT/EN): `src/i18n/`
- Gráficos: `src/components/charts/`
- Dados pessoais e links (autor, GitHub, LinkedIn, URL do site): `src/site.config.ts`
