# Relatório de TDD - Testes Unitários
**Disciplina:** Fundamentos do TDD e Testes Unitários (PAC)
**Instituição:** Católica de Santa Catarina
**Aluno:** João Paulo Faust (jotabasso)

## 1. Funcionalidade Escolhida e Regras de Negócio
A funcionalidade central escolhida para a implementação do TDD foi o **Cadastro de Usuários (Register)**. Esta lógica foi isolada na camada de Service (`userService.js`).

As regras de negócio implementadas e validadas foram:
- Todos os dados (username, email, password, confirmPassword) são de preenchimento obrigatório.
- A senha deve conter no mínimo 6 caracteres.
- A senha e a confirmação de senha devem ser idênticas.
- O e-mail deve possuir um formato válido (Regex).
- Não é permitido o cadastro de um e-mail já existente no banco de dados.
- Não é permitido o cadastro de um *username* já existente no banco de dados.
- Em caso de sucesso, a senha deve obrigatoriamente ser criptografada (hash) utilizando `bcryptjs` antes da persistência no banco.

## 2. Aplicação do Ciclo TDD (Red-Green-Refactor)
A implementação seguiu estritamente o ciclo de Desenvolvimento Orientado a Testes:

1. **Red (Escrever um teste que falha):** Primeiramente, os cenários de teste foram escritos no arquivo `userService.spec.js` validando as regras acima, utilizando asserções do Vitest (como `expect().toThrow`). Ao rodar `npm test`, os testes quebravam pois a lógica não existia no Service.
2. **Green (Fazer o teste passar):** Fomos no arquivo `userService.js` e implementamos a lógica mais simples possível (os blocos `if` lançando os `throw new Error`) para fazer o teste específico ficar verde.
3. **Refactor (Melhorar o código):** Com os testes passando, o código foi reorganizado para melhorar sua legibilidade, garantindo que o acoplamento do banco de dados ficasse abstraído utilizando os `mocks` do Vitest (`vi.mock('../userModel.js')`).

## 3. Exemplos de Testes Unitários

Abaixo estão explicados três dos dez testes implementados:

* **Exemplo 1: `Deve lançar erro se as senhas não coincidirem`**
    * **O que verifica:** Garante a regra de negócio básica de digitação. Passamos um payload onde a propriedade `password` é diferente de `confirmPassword`.
    * **Asserção:** Utiliza `expect().rejects.toThrow('As senhas não coincidem.')` para confirmar que o sistema barra a execução e devolve a mensagem exata para o frontend.

* **Exemplo 2: `Deve lançar erro se o e-mail já estiver cadastrado no banco`**
    * **O que verifica:** Impede a duplicidade de contas. 
    * **Asserção:** Utilizamos `User.findOne.mockResolvedValueOnce()` para "enganar" o Service, fazendo-o achar que o banco retornou um usuário. O teste valida se a aplicação interrompe a criação e lança a exceção correta, sem acessar o banco real.

* **Exemplo 3: `Deve retornar o objeto do usuário recém-criado em caso de sucesso`**
    * **O que verifica:** O fluxo principal feliz (Happy Path). 
    * **Asserção:** Simulamos que o banco não achou duplicidades e usamos o método do Vitest `expect(result).toHaveProperty('id', 99)` para validar se o retorno do Service possui as propriedades corretas geradas pelo banco de dados mockado.