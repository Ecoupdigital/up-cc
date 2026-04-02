# Blueprint: E-commerce

Aplicar quando: "loja", "produtos", "carrinho", "checkout", "pedidos", "inventario", "vender online".

---

## Catalogo (CATALOG)

- CATALOG-01: Listagem de produtos com grid/lista toggle
- CATALOG-02: Busca por nome/descricao
- CATALOG-03: Filtros por categoria, preco, disponibilidade
- CATALOG-04: Ordenacao (preco, nome, mais vendidos, mais recentes)
- CATALOG-05: Pagina de detalhes do produto (imagens, descricao, preco, variacoes)
- CATALOG-06: Galeria de imagens com zoom/carousel
- CATALOG-07: Produtos relacionados
- CATALOG-08: Badge de estoque (em estoque, ultimas unidades, esgotado)

## Carrinho (CART)

- CART-01: Adicionar ao carrinho com feedback visual
- CART-02: Mini-cart (dropdown ou sidebar)
- CART-03: Pagina do carrinho (itens, quantidades, subtotais)
- CART-04: Alterar quantidade e remover item
- CART-05: Carrinho persistente (localStorage ou banco)
- CART-06: Resumo com subtotal, frete, desconto, total
- CART-07: Cupom de desconto

## Checkout (CHECKOUT)

- CHECKOUT-01: Checkout em steps (dados → endereco → pagamento → confirmacao)
- CHECKOUT-02: Dados do cliente (nome, email, telefone)
- CHECKOUT-03: Endereco de entrega (com CEP e auto-complete)
- CHECKOUT-04: Metodos de pagamento (cartao, pix, boleto)
- CHECKOUT-05: Resumo final antes de confirmar
- CHECKOUT-06: Pagina de confirmacao com numero do pedido
- CHECKOUT-07: Email de confirmacao automatico

## Pedidos (ORDER)

- ORDER-01: Meus pedidos (historico do cliente)
- ORDER-02: Detalhes do pedido (itens, status, rastreamento)
- ORDER-03: Status do pedido (pendente, pago, enviado, entregue, cancelado)
- ORDER-04: Admin: gestao de pedidos (listar, filtrar por status, atualizar)
- ORDER-05: Notificacao de mudanca de status

## Inventario (STOCK)

- STOCK-01: Controle de estoque por produto/variacao
- STOCK-02: Alerta de estoque baixo
- STOCK-03: Nao permitir venda de produto sem estoque
- STOCK-04: Historico de movimentacao
