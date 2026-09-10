# QR Code Grid

Gerador de folhas de QR code para imprimir e recortar. O usuário digita o conteúdo,
escolhe o tamanho da grade e a quantidade, e baixa um PDF pronto.

**Tudo acontece no navegador** — não existe rota de API, nada é enviado para servidor.
O app é exportado como site estático (`output: 'export'`).

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build estático

```bash
npm run build    # gera ./out — pode subir em qualquer host estático
npm start        # serve ./out localmente
```

## Como funciona

| Arquivo | Papel |
| --- | --- |
| [lib/layout.js](lib/layout.js) | Toda a matemática da grade em milímetros: células, tamanho do QR, paginação e linhas de corte. Fonte única de verdade para o preview **e** para o PDF. |
| [lib/qr.js](lib/qr.js) | Gera os QR codes (`qrcode`) como data URL, com cache por conteúdo — conteúdos repetidos são desenhados uma vez só. |
| [lib/pdf.js](lib/pdf.js) | Monta o PDF com `jspdf` em unidade `mm`. A mesma imagem é embutida uma única vez via *alias*, então 500 QR codes iguais não pesam no arquivo. |
| [components/SheetPreview.js](components/SheetPreview.js) | Preview em SVG com `viewBox` em milímetros — o mesmo sistema de coordenadas do PDF, então a tela mostra exatamente o que sai na folha. |
| [app/page.js](app/page.js) | Estado do formulário, geração instantânea do preview e download. |

## Detalhes que importam na impressão

- As imagens do PDF são renderizadas a ~600 dpi do tamanho impresso, então o QR sai nítido.
- Cada QR mantém uma *quiet zone* de 2 módulos mais um respiro interno na célula — sem isso,
  leitores falham quando o corte encosta no código.
- Imprima em escala 100% (desligue "ajustar à página") para o tamanho em mm sair exato.
