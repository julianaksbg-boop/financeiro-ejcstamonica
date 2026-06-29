## Central de Movimentações — Evolução do MVP

Vou unificar **Importação** e **Movimentações** em uma única experiência chamada **Central de Movimentações** (rota `/movimentacoes`), no estilo "caixa de entrada" de tarefas financeiras. A rota antiga `/importar` passa a abrir o wizard direto sobre a Central.

### 1. Estrutura da página

```text
┌──────────────────────────────────────────────┬──────────────┐
│  Cabeçalho + ações [📥 Importar] [➕ Novo]   │              │
├──────────────────────────────────────────────┤   Painel     │
│  Cards resumo (7 indicadores animados)       │   lateral    │
├──────────────────────────────────────────────┤   fixo       │
│  Barra de progresso de classificação         │              │
├──────────────────────────────────────────────┤  • Último    │
│  Filtros rápidos (chips) + pesquisa global   │    extrato   │
├──────────────────────────────────────────────┤  • Período   │
│  Barra de ações em lote (quando há seleção) │  • Saldo     │
├──────────────────────────────────────────────┤  • Pendências│
│  Tabela moderna com seleção múltipla         │              │
└──────────────────────────────────────────────┴──────────────┘
```

Ao clicar numa linha, abre um **Sheet lateral** com Dados do Extrato, Sugestão Inteligente (quando houver) e formulário de Classificação.

### 2. Cards resumo (auto-atualizam)

Total movimentado · Receitas · Despesas · Pendentes · Classificadas · Adiantamentos · Última atualização.

### 3. Tabela

Colunas: Status · Data · Descrição · Fornecedor · Valor · Evento · Responsável · Forma pgto · Categoria · Obs.

- Indicador visual por linha: 🟢 Classificada · 🟠 Pendente · 🔵 Sugestão · 🔴 Adiantamento
- Ordenação por coluna, pesquisa instantânea, paginação, seleção múltipla via checkbox
- Linha muda para verde com animação ao classificar
- Ocultar colunas via menu (redimensionar fica como melhoria futura — custo alto vs valor para MVP)

### 4. Wizard de Importação (3 etapas em Dialog)

- **Etapa 1**: drag-and-drop / seletor. Mostra nome, qtd movimentações, período, última movimentação.
- **Etapa 2**: prévia destacando 🟢 Novas e 🟡 Já importadas. Botões "Importar apenas novas" / "Importar todas".
- **Etapa 3**: tela de sucesso com confete discreto, fecha e movimentações já aparecem na Central.

### 5. Sugestões inteligentes

Para cada movimentação pendente, o sistema procura no histórico **classificado** outras movimentações com o mesmo `nome` (case-insensitive). Se encontra, propõe Evento / Responsável / Categoria / Forma pgto mais frequentes. Mostra card "💡 Sugestão encontrada" no Sheet com botões **Aceitar** e **Editar**. Nunca preenche automaticamente.

### 6. Classificação em lote

Quando há linhas selecionadas, aparece barra fixa no topo da tabela com: Evento · Responsável · Forma de pgto · Categoria · Observação + botão "Aplicar a N selecionadas". Campos vazios não são aplicados.

### 7. Filtros rápidos (chips)

Todos · Pendentes · Classificadas · Receitas · Despesas · Adiantamentos · Com Sugestão · Sem Sugestão · + selects para Evento / Responsável / Ano / Forma pgto.

### 8. Lançamento manual

Botão "➕ Novo Lançamento" abre o mesmo Sheet de classificação com campos de extrato editáveis (data, nome, valor, detalhe).

### 9. Microinterações

- Toast "Movimentação classificada com sucesso" (sonner)
- Linha verde com `animate-fade-in` ao classificar
- Barra de progresso anima suavemente
- Quando 100% classificado → banner discreto "🎉 Tudo classificado"

### Detalhes técnicos

**Store (`src/lib/movimentacoes-store.ts`)** já existe com Zustand + persistência. Acrescentar:
- selectors derivados (`useResumo`, `useSugestao(nome)`)
- método `addManual(mov)` e `updateMany(ids, patch)`

**Novos arquivos**:
- `src/components/movimentacoes/import-wizard.tsx` (Dialog 3 etapas, reaproveita `parse-extrato.ts`)
- `src/components/movimentacoes/classify-sheet.tsx` (extraído do route atual, com card de sugestão)
- `src/components/movimentacoes/bulk-bar.tsx`
- `src/components/movimentacoes/resumo-cards.tsx`
- `src/components/movimentacoes/side-panel.tsx`
- `src/lib/sugestoes.ts` (pura — recebe lista classificada e retorna sugestão por nome)

**Rotas**:
- `src/routes/_app.movimentacoes.tsx` reescrita como Central
- `src/routes/_app.importar.tsx` redireciona para `/movimentacoes?import=1` (mantém compat) ou é removida do menu — vou **remover** do menu lateral e excluir o arquivo, já que a ação fica no botão "Importar Extrato" da Central
- `_app.tsx`: remover entrada "Importar" do menu (Visualizador já não via)

**Escopo deliberadamente fora**:
- Upload de comprovante (precisa Storage — fica para próxima iteração, deixo botão desabilitado com tooltip "em breve")
- Redimensionar colunas (custo alto, baixo retorno no MVP)
- Atalhos de teclado (anoto como follow-up)
- Persistência das classificações no Supabase (segue em localStorage como o resto do protótipo)

Confirma que posso seguir, ou quer ajustar algum ponto (ex: incluir upload de comprovante agora, manter rota `/importar`, priorizar atalhos de teclado)?
