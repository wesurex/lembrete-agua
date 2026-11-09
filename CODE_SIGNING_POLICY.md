# Política de assinatura de código

Free code signing provided by SignPath.io, certificate by SignPath Foundation

## Papéis

- **Autor, mantenedor e aprovador:** Wesley Reinert da Silva. Aprova cada release e é o único com permissão de publicar tags e releases neste repositório.
- Não há outros membros com acesso de escrita. Se isso mudar, esta política será atualizada antes de qualquer novo membro assinar releases.

## O que é assinado

- Somente o instalador do Windows (`agua-setup-<versão>.exe`).
- O instalador é gerado pelo GitHub Actions a partir do código deste repositório, no workflow `.github/workflows/release-windows.yml`, a partir de uma tag `v*`.
- Não são assinados builds gerados na máquina de um desenvolvedor.

## Regras

- Todos os envolvidos usam autenticação em dois fatores no GitHub e no SignPath.
- O projeto não inclui componentes proprietários ou de código fechado.
- Quem encontrar um binário assinado que não corresponde a uma release publicada deve abrir uma issue no repositório.

## Privacidade

O app não coleta nem envia dados pessoais. A única conexão com a internet é a verificação de novas versões nas releases deste repositório no GitHub, e pode ser ignorada se a rede estiver indisponível.
