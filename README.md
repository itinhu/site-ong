# Raízes do Amanhã — site da ONG

Projeto de Ítalo Iran Costa dos Santos para a disciplina de Introdução à Computação. A ONG, a equipe e os projetos são fictícios.

## Versão JavaScript — terceira nota

A versão `v2-javascript` mantém o site institucional e acrescenta três experiências interativas. O JavaScript está separado em `js/script.js`, sem scripts ou eventos inline no HTML.

### Simulador de doação e impacto

O usuário informa um valor em BRL e escolhe USD ou EUR. A página consulta a [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) no endpoint `https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL` e divide o valor em reais pela taxa `bid` da moeda escolhida. A tela mostra o equivalente internacional, a taxa utilizada e a data/hora da cotação retornada pela API. O botão permite atualizar a consulta; requisições públicas podem ter cache de um minuto.

A estimativa de impacto considera R$ 5 por muda e arredonda a quantidade para baixo. Esse custo é ilustrativo. O simulador não processa pagamentos, não inclui tarifas de câmbio e continua calculando mudas quando a cotação está indisponível. Aceita valores de R$ 0,01 a R$ 1.000.000,00, com até duas casas decimais.

### Seja um voluntário

O formulário valida nome, e-mail, CEP, cidade e UF enquanto o usuário digita e novamente no envio, destacando campos inválidos com CSS e mensagens textuais. O primeiro erro recebe o foco ao tentar enviar.

Ao completar oito dígitos de CEP, o JavaScript consulta `https://viacep.com.br/ws/CEP/json/` no [ViaCEP](https://viacep.com.br/) e preenche rua, bairro, cidade e UF. Há tratamento para CEP inexistente, falhas de rede e respostas atrasadas de consultas anteriores. O endereço pode ser corrigido ou preenchido manualmente. CEP de formato válido não garante endereço existente quando preenchido manualmente.

A inscrição é uma demonstração: o envio é interceptado por `preventDefault()` e exibe uma confirmação na página. Não há backend, armazenamento local ou envio de cadastro à ONG. Apenas o CEP é enviado ao ViaCEP; nenhum campo de senha é necessário.

### Mapa interativo

O [Leaflet](https://leafletjs.com/) 1.9.4, carregado via CDN, exibe um mapa com imagens do OpenStreetMap e dois marcadores em espaços públicos de Salvador: Campo Grande e Dique do Tororó. São pontos demonstrativos, sem vínculo com a ONG e sem representar uma sede real.

O usuário pode mover o mapa, usar o zoom, abrir os marcadores e selecionar locais pelos botões. A roda do mouse não altera o zoom, facilitando a rolagem da página. Há um link alternativo para o OpenStreetMap caso o mapa não carregue.

## Conceitos aplicados

- Manipulação do DOM: atualização de resultados, mensagens e campos de endereço.
- CSS dinâmico: atributos `aria-invalid` alteram o destaque dos campos e o botão de cotação fica desabilitado durante consultas.
- Eventos: `input`, `change`, `blur`, `click` e `submit`.
- Consumo de APIs: `fetch`, `async/await`, JSON, timeout e tratamento de erros.
- Acessibilidade: labels, mensagens associadas aos campos, regiões de status, foco no erro e navegação por teclado.
- Layout responsivo para celular e computador.

## Como executar

Não é necessário instalar dependências ou configurar chaves de API. Na pasta do projeto, execute:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Encerre o servidor com `Ctrl+C`. As APIs, o CDN do Leaflet e as imagens do mapa precisam de acesso à internet. O restante do conteúdo e o cálculo de impacto são locais.

## Como conferir as funcionalidades

1. No simulador, mantenha R$ 50: a estimativa deve ser de 10 mudas. Troque USD por EUR e verifique a atualização do resultado e da cotação. Experimente um valor negativo ou vazio para ver a validação.
2. Clique em atualizar cotação e observe o estado de carregamento. Sem internet, confira a mensagem de indisponibilidade e o funcionamento do cálculo de mudas.
3. Envie o formulário vazio e observe os erros. Digite um nome curto e um e-mail inválido; depois corrija os dados.
4. Digite `01001-000`: o ViaCEP deve preencher um endereço em São Paulo/SP. Experimente `99999-999` para a mensagem de CEP não encontrado. Confira também o preenchimento manual sem internet.
5. Complete os campos e simule a inscrição: a mensagem deve esclarecer que nenhum cadastro foi enviado ou salvo.
6. No mapa, selecione cada local e abra seus marcadores. Verifique o zoom, a navegação pelo teclado e a visualização em uma tela estreita.

## Estrutura

```text
index.html       Conteúdo e formulários
css/style.css    Estilos institucionais, responsividade e estados de validação
js/script.js     Simulador, APIs, validação e mapa
imagens/         Imagens e ícone do projeto
```

## Verificação realizada

A sintaxe foi verificada com `node --check js/script.js`, e os arquivos com `git diff --check`. Um teste automatizado com DOM e respostas de API simulados verificou cálculo de mudas, conversão, valor inválido, campos obrigatórios, preenchimento por CEP, confirmação demonstrativa e ausência do Leaflet. Esse teste não substitui a conferência visual e das APIs reais no navegador.
