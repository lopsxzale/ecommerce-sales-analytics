# E-commerce Sales Analytics

Análise de ponta a ponta (ETL → SQL → Python → Dashboard) sobre dados reais de um marketplace brasileiro, para responder perguntas de negócio que qualquer operação de e-commerce/varejo enfrenta.

## Contexto

Projeto de portfólio para demonstrar o ciclo completo de um analista de dados: ingestão de dados brutos, modelagem relacional em PostgreSQL, consultas SQL analíticas (CTEs, window functions), análise exploratória em Python/pandas e um dashboard publicado com os insights.

## Perguntas de negócio

1. Atraso na entrega afeta a nota dada pelo cliente no review? Em quanto?
2. Quais categorias de produto e regiões (estado) geram mais receita e qual o ticket médio de cada uma?
3. Como está a sazonalidade das vendas ao longo do ano (meses/dias de maior volume)?
4. Segmentação de clientes por RFM (Recência, Frequência, Valor monetário) — quais grupos merecem ação de retenção?
5. Tempo médio de entrega por estado/região e seu impacto na satisfação.

## Fonte de dados

[Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (Kaggle) — ~100k pedidos reais e anonimizados de um marketplace brasileiro (2016–2018), com tabelas de pedidos, itens, pagamentos, reviews, clientes, vendedores e geolocalização.

## Stack

- **Banco de dados:** PostgreSQL
- **ETL/Análise:** Python (pandas, SQLAlchemy, psycopg2)
- **Visualização:** Streamlit + Plotly
- **Notebook exploratório:** Jupyter

## Roadmap

- [ ] Baixar o dataset do Kaggle e colocar os CSVs em `data/raw/`
- [ ] Criar o schema relacional em `sql/schema.sql` e carregar os dados (`src/load.py`)
- [ ] Escrever as queries analíticas em `sql/analysis/` (uma por pergunta de negócio)
- [ ] Notebook de EDA em `notebooks/01_exploracao.ipynb`
- [ ] Segmentação RFM em `src/rfm.py`
- [ ] Dashboard Streamlit em `dashboard/app.py` com os principais insights
- [ ] Publicar o dashboard (Streamlit Community Cloud) e colar o link abaixo
- [ ] Escrever a seção "Insights e Recomendações" neste README com os achados finais

## Como rodar localmente

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# configurar DATABASE_URL em um arquivo .env (ver .env.example, a criar)
python src/load.py
streamlit run dashboard/app.py
```

## Dashboard ao vivo

_(link a publicar após a implementação)_

## Insights e recomendações

_(a preencher depois da análise)_
