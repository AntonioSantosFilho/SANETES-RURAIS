# Assets extraídos do projeto AIA

Origem: `sanetes.aia`, pacote `assets/`.

Foram migrados somente recursos visuais. O arquivo `google-services.json` e os
componentes externos do Kodular foram deliberadamente excluídos.

## Imagens

| Arquivo atual | Arquivo original | Uso encontrado no AIA |
|---|---|---|
| `brand-symbol.png` | `logoOFC.png` | Visualização de sistemas preenchidos, criado por blocos dinâmicos |
| `brand-wordmark.png` | `lgoogog.png` | Tela de login (`Screen1`) |
| `logo-irpaa.png` | `LOGO_IRPPA-removebg-preview.png` | Sem referência ativa nas telas ou blocos |
| `button-home.png` | `INICIO_BUTTON.png` | Cadastro, visualização de sistemas e visualização de usuários |
| `button-exit.png` | `SAIR_BUTTON.png` | Cadastro, visualização de sistemas e visualização de usuários |
| `button-add.png` | `add_button-removebg.png` | Adicionar usuário na visualização de usuários |
| `folder.png` | `folder2.png` | Lista de sistemas preenchidos |
| `offline.png` | `sem_internet_(1).png` | Login e envio do questionário |
| `cluster-0.png` | `CLUSTER_0.png` | Questionário, carregado dinamicamente pelos blocos |
| `cluster-1.png` | `CLUSTER_1.png` | Questionário, carregado dinamicamente pelos blocos |
| `cluster-2.png` | `CLUSTER_2.png` | Questionário, carregado dinamicamente pelos blocos |
| `sample-green.png` | `amostra_verde.png` | Seleção visual de cor no questionário |
| `sample-brown.png` | `amostra_marrom.png` | Seleção visual de cor no questionário |
| `sample-dark-brown.png` | `amostra_marrom_escuro.png` | Seleção visual de cor no questionário |

Os três arquivos `cluster-*` são tabelas de faixas laboratoriais. Seus nomes
numéricos foram preservados porque o AIA não registra um significado textual
confiável para cada tabela.

## Animações Lottie

| Arquivo atual | Arquivo original | Uso encontrado no AIA |
|---|---|---|
| `loading.json` | `97930-loading.json` | Login, cadastro e envio do questionário |
| `success.json` | `sucesso.json` | Cadastro e conclusão do questionário |
| `failure.json` | `colsejson.json` | Sem referência ativa; mantido como feedback de falha disponível |

## Fontes

| Arquivo atual | Arquivo original | Uso encontrado no AIA |
|---|---|---|
| `poppins-regular.ttf` | `Poppins-Regular.ttf` | Login, questionário e visualização de usuários |
| `poppins-bold.ttf` | `Poppins-Bold.ttf` | Todas as cinco telas |

## Convenção de acesso

O catálogo em `apps/web/src/lib/assets.ts` centraliza os caminhos públicos. As
telas novas devem importar esse catálogo em vez de repetir strings de URL.

