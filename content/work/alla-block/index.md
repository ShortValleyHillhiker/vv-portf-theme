---
title: Alla block
client: Testcase
date: 2026-11-08
description: Testsida med alla case-block.
category: Test
tags: [Test, Formatering]
banner: gbgv3.webp
intro: "Testsida med varje formateringsblock som ett case kan använda: brief, ingress, två och tre spalter, citat, mediarutnät, bildtexter och vanlig Markdown."
# Test content: shown with `hugo server -D`, left out of the real build
draft: true
brief:
  - { label: Kund, value: Testkund AB }
  - { label: Roll, value: "Art direction, koncept" }
  - { label: År, value: "2026" }
  - { label: Byrå, value: Confetti }
---

{{< brief >}}

![Testbild, stor](gbgv1.webp "Bildtext under en stor bild (case-media large).")
{.large}

{{< lead >}}
Ingress (case-text lead): en större text som för berättelsen framåt mellan bilderna.
{{< /lead >}}

{{< text title="Två spalter" cols="2" >}}
Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.

Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.
{{< /text >}}

{{< text title="Tre spalter" cols="3" >}}
Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.

Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.

Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.
{{< /text >}}

{{< grid >}}
![Testbild, halv bredd](gbgv4.webp "Två bilder bredvid varandra.")

![Testbild, halv bredd](gbgv2.webp)

![Testbild, hel bredd, med parallax](gbgv5.webp "Bild med parallax (parallax=true).")
{.large parallax=true}
{{< /grid >}}

{{< quote cite="Förnamn Efternamn, titel på Testkund AB" >}}
”Ett citat från kunden eller en kollega, satt stort mellan bilderna.”
{{< /quote >}}

{{< grid >}}
![Testbild, en tredjedel](gbgv0.webp)

![Testbild, en tredjedel](gbgv3.webp)

![Testbild, en tredjedel](gbgv1.webp)
{{< /grid >}}

## Rubrik från Markdown

Vanligt stycke från Markdown, med en [länk i texten](/) och lite **fetstil**. Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.

- Punktlista, första punkten
- Andra punkten, lite längre för att se radbrytning i listan
- Tredje punkten

> Blockcitat från Markdown, med en linje till vänster.

---

### Mindre rubrik

1. Numrerad lista
2. Andra steget

Platshållartext för att testa formateringen. Den här meningen finns bara för att fylla ut stycket så att radlängd, radavstånd och styckeavstånd syns tydligt.
