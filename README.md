# Reta do Sim

Painel financeiro e operacional para casais acompanharem pagamentos, ressarcimentos e tarefas da reta final do casamento.

## O que faz

- Cria um painel compartilhável por casal, sem senha
- Organiza custos, pagamentos e valores a receber
- Mantém checklist geral e tarefas por item
- Permite publicar no EasyPanel com persistência em volume

## Rodando localmente

```bash
npm start
```

O app sobe na porta `3000`.

## Deploy no EasyPanel

- Tipo de serviço: `App`
- Build: `Dockerfile`
- Porta: `3000`
- Volume persistente: montar em `/app/storage`

## Estrutura

- `server.js`: servidor HTTP e API dos workspaces
- `app.js`: lógica do frontend
- `index.html`: interface
- `styles.css`: estilos
