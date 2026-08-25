# EJC Finanças Simples

Sistema Financeiro EJC – Gestão Financeira para Encontro de Jovens com Cristo

Crie uma aplicação web moderna, intuitiva, responsiva e extremamente simples para gestão financeira do Encontro de Jovens com Cristo (EJC).

O foco não é ser um ERP ou sistema contábil completo. O objetivo é permitir o controle financeiro do grupo, classificação de movimentações bancárias, prestação de contas dos eventos e geração de dashboards financeiros para acompanhamento da coordenação.

A aplicação será utilizada principalmente por uma única pessoa responsável pelo financeiro, portanto a simplicidade e velocidade de uso devem ser priorizadas acima de qualquer complexidade operacional.

Objetivo Principal

O sistema deve responder facilmente às seguintes perguntas:

Quanto dinheiro temos?

Quanto entrou?

Quanto saiu?

Onde estamos gastando?

Qual evento arrecadou mais?

Qual equipe consumiu mais recursos?

Como o encontrão deste ano se compara aos anteriores?

Perfis de Usuário

Administrador Financeiro

Único usuário operacional do sistema.

Permissões:

Importar extratos

Classificar movimentações

Criar e editar lançamentos

Gerenciar eventos

Gerenciar responsáveis

Controlar adiantamentos

Realizar prestações de contas

Visualizar dashboards

Exportar relatórios

Coordenação / Equipe Dirigente

Perfil apenas para consulta.

Permissões:

Visualizar dashboards

Visualizar relatórios

Consultar comparativos históricos

Restrições:

Não pode editar lançamentos

Não pode excluir registros

Não pode importar extratos

Estrutura Financeira

Eventos

O sistema deve permitir registrar movimentações por evento.

Eventos iniciais:

XX Encontrão

XXI Encontrão

Quitandas

Rifa

Santa Massa

Confraternização

Dia das Crianças

Encontros Semanais

Deve ser possível criar novos eventos futuramente.

Responsáveis

Os lançamentos devem possuir um responsável.

Dependendo do evento, o responsável poderá ser uma equipe ou um pilar.

Equipes do Encontrão

Mini Bar

Camisetas

Secretaria

Inscrições

Doações

Sala e Música

Liturgia

Cozinha e Café

Ordem

Kids

Externa

Acolhida

Pilares

Liturgia

Ação Social e Eventos

Artes e Lazer

Marketing

Música

Importação de Extrato InfinityPay

Esta será a principal forma de entrada de dados.

O sistema deve importar arquivos Excel (.xlsx) exportados da InfinityPay.

Estrutura identificada:

Data

Hora

Tipo de Transação

Nome

Detalhe

Valor

Fluxo:

Usuário importa arquivo.

Sistema exibe prévia das movimentações.

Sistema identifica possíveis duplicidades.

Usuário confirma a importação.

Movimentações ficam disponíveis para classificação.

O sistema deve permitir importar extratos históricos desde 2025.

Classificação de Movimentações

Criar uma tela central de classificação.

Cada movimentação deve possuir:

Tipo

Receita

Despesa

Adiantamento

Evento

Selecionado pelo usuário.

Responsável

Selecionado pelo usuário.

Forma de Pagamento

PIX

Débito

Crédito

Dinheiro

Transferência

Observação

Campo livre.

Comprovante

Upload opcional.

Sugestão Inteligente de Classificação

O sistema pode sugerir classificações com base no histórico.

Exemplo:

"Supermercado Bretas"

Sugestão:

Evento: XXI Encontrão

Responsável: Cozinha e Café

Tipo: Despesa

O sistema nunca deve classificar automaticamente.

Toda sugestão deve ser aprovada ou editada pelo administrador.

O administrador sempre terá a decisão final.

Adiantamentos e Prestação de Contas

Criar módulo específico para controle de adiantamentos.

Exemplo:

PIX para Equipe de Compras

Valor:
R$ 3.000

Status:
Em prestação de contas

Posteriormente o administrador poderá registrar os gastos apresentados.

Exemplo:

Mercado ABC → Cozinha e Café → R$ 800

Padaria XYZ → Mini Bar → R$ 250

Copos descartáveis → Acolhida → R$ 120

O sistema deve exibir:

Valor adiantado

Valor prestado

Saldo pendente

Status da prestação de contas

Status possíveis:

Pendente

Parcialmente Prestado

Prestação Concluída

Histórico Financeiro

O sistema deve manter histórico de vários anos.

Estrutura:

2025
2026
2027
...

Permitindo comparações entre exercícios financeiros.

Dashboard Financeiro

O dashboard deve ser visual, moderno e intuitivo.

Exibir:

Indicadores Principais

Saldo Atual

Receitas do Ano

Despesas do Ano

Resultado Acumulado

Última Atualização

Gráficos

Receitas x Despesas por mês

Gráfico de colunas.

Fluxo de Caixa Mensal

Gráfico de linha.

Gastos por Responsável

Gráfico de barras.

Gastos por Pilar

Gráfico de pizza ou barras.

Receitas por Categoria

Exemplos:

Inscrições

Doações

Rifa

Quitandas

Santa Massa

Confraternização

Comparação entre Encontrões

Comparar:

XX Encontrão

XXI Encontrão

XXII Encontrão

Indicando:

Receita total

Despesa total

Resultado final

Controle Operacional

Exibir alertas para:

Movimentações não classificadas

Adiantamentos pendentes de prestação de contas

Extratos recém importados

Relatórios

Permitir exportação em PDF e Excel.

Relatórios:

Receitas por evento

Despesas por evento

Gastos por responsável

Prestação de contas dos adiantamentos

Comparação entre encontrões

Prestação de contas consolidada do ano

Design e Experiência

Inspirar-se visualmente em:

Power BI

Conta Azul

Nibo

Princípios:

Poucos cliques

Interface limpa

Fácil aprendizado

Foco em produtividade

Funcionar bem em notebook e celular

O sistema deve transmitir organização, transparência financeira e facilidade de prestação de contas para a coordenação do EJC.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://financeiro-ejcstamonica.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/839de5a4-f89b-4d36-b26c-4307f4e71e1b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
