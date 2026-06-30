# Relatório Técnico N3: Implementação de Nova Funcionalidade com TDD
**Projeto:** PodWave
**Funcionalidade Escolhida:** Sistema de Avaliações (Reviews) de Podcasts

---

## 1. Descrição da Funcionalidade e Regras de Negócio
A funcionalidade implementada consiste em um sistema de avaliações (Reviews) onde os usuários podem atribuir uma nota e deixar um comentário nos episódios de podcast do catálogo.

As **regras de negócio** implementadas para garantir a integridade do sistema foram:
1. **Validação de Campos:** O envio da nota é obrigatório.
2. **Limites de Avaliação:** A nota deve ser estritamente um valor numérico entre 1 e 5.
3. **Integridade Referencial:** A avaliação só pode ser salva se o Podcast e o Usuário existirem no banco de dados.
4. **Prevenção de Duplicidade:** Um usuário só pode avaliar um mesmo podcast uma única vez.
5. **Moderação de Conteúdo:** O sistema barra comentários que contenham palavras impróprias predefinidas (ex: "lixo").

---

## 2. Aplicação do TDD (Ciclo Red-Green-Refactor)
O desenvolvimento seguiu estritamente o ciclo TDD:

* **Fase RED (Escrever o teste que falha):** Inicialmente, criamos o Model `reviewModel.js` e a suíte de 10 testes unitários no arquivo `reviewService.spec.js`. Como a camada de serviço (`reviewService.js`) ainda não existia ou estava vazia, ao rodar `npm test`, o Vitest estourou erros de módulos não encontrados e rejeições não mapeadas.
* **Fase GREEN (Fazer o teste passar):** Em seguida, desenvolvemos o arquivo `reviewService.js`, implementando todas as travas condicionais (regras de negócio) e a chamada ao `Review.create`. Rodamos o teste novamente e obtivemos 100% de sucesso.
* **Fase REFACTOR (Melhorar o código):** Durante o desenvolvimento dos testes de integração, enfrentamos problemas de *Timeout* devido ao servidor tentar conectar ao MariaDB real. Refatoramos a abordagem de testes de integração implementando um "Mini-App" Express isolado, falsificando o banco de dados diretamente nos testes. Isso fez o tempo de execução cair de +40 segundos (com falhas) para 1.75 segundos, garantindo performance e isolamento.

---

## 3. Explicação dos Testes Desenvolvidos

Abaixo está o detalhamento técnico de 5 testes chave da nossa suíte (3 unitários e 2 de integração).

### Testes Unitários (`reviewService.spec.js`)
**A. Teste de Validação de Limites (Falha Esperada)**
* **O que verifica:** Garante que o sistema não aceita notas inválidas (ex: maiores que 5).
* **Mock utilizado:** Nenhum mock de banco foi necessário acionar, pois a validação ocorre antes.
* **Asserção:** Usamos `expect().rejects.toThrow('A nota deve ser entre 1 e 5.')` para garantir que o serviço lança a exceção correta.

**B. Teste de Prevenção de Duplicidade (Falha Esperada)**
* **O que verifica:** Impede que um usuário avalie o mesmo podcast duas vezes.
* **Mock utilizado:** Usamos `vi.mock()` no `reviewModel`. Especificamente, `Review.findOne.mockResolvedValue({ id: 10 })` simulou que o banco já havia encontrado uma avaliação anterior para aquele usuário.
* **Asserção:** Usamos `expect().rejects.toThrow('Você já avaliou este podcast.')`.

**C. Teste de Sucesso Absoluto**
* **O que verifica:** A correta gravação da avaliação quando todos os dados são válidos.
* **Mock utilizado:** Simulamos a existência do podcast, a existência do usuário, a ausência de duplicidade e forçamos a criação com `Review.create.mockResolvedValue({ id: 1, rating: 5 })`.
* **Asserção:** Usamos `expect().toHaveProperty('id')` para verificar a estrutura do retorno e `expect(Review.create).toHaveBeenCalledTimes(1)` para garantir que o banco de dados falso foi acionado.

### Testes de Integração (`review.integration.spec.js` com Supertest)
**D. Verificação de Middleware de Autenticação (Status 302)**
* **O que verifica:** Garante que a rota da API é protegida e redireciona usuários não logados.
* **Mock utilizado:** Mockamos o `authMiddleware` para simular uma sessão ausente.
* **Asserção:** Usamos Supertest para dar um POST e `expect(response.status).toBe(302)` para garantir o redirecionamento.

**E. Criação de Avaliação via HTTP (Status 201)**
* **O que verifica:** O fluxo de ponta a ponta (Rota -> Controller -> Service -> Mock do DB).
* **Mock utilizado:** Além de mockar a sessão ativa (com o usuário *jotabasso* injetado), mockamos as respostas do `User`, `Podcast` e `Review` para devolver dados de sucesso imediatos.
* **Asserção:** `expect(response.status).toBe(201)` (Status HTTP Created) e verificamos a estrutura JSON de resposta com `expect(response.body.success).toBe(true)`.

---

## 4. Instruções para Execução do Projeto e Testes

Para garantir que a aplicação e os testes rodem em um ambiente limpo, siga as instruções:

1. Instale as dependências essenciais do Node.js:
   ```bash
   npm install