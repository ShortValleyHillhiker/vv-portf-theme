---
title: "Hello, world?"
date: 2026-10-20
intro: "Kul att du är här, jag har en vanföreställning att jag som inte arbetar med text ska börja skriva. Kanske kommer det inlägg om mitt liv, anekdoter som inte passar in i ett case eller ah, lösa tankar. Vi får se hur det går, förhoppningen är att lyckas dela med mig lite av mina tankar."
---

*När jag ändå sitter här och skriver, tänker jag ta tillfället i akt och prata lite om det monsterprojekt som denna portfolio blivit.* Allt som allt har detta projekt varit pågående i fyra år. Det är inte för sent, du kan [fortfarande återvända till startsidan](/)

## Lite bakgrund för den som utav någon otänkbar anledning är intresserad

Jag gick på IT-gymnasiet i Göteborg, teknikprogrammet med inriktning teknik & media. En del av ämnena under den utbildning var webbutveckling och webbserverprogrammering. Ett “ämnesområde” jag faktiskt älskade. Jag fick B i webbserverprogrammering, kommer ihåg att vågskålen balanserade mellan A eller B. Det var ett skript i min slutleverans som inte importerades korrekt, jag förstod varför det var så men var såpass skoltrött att jag lät det vara. Jag skulle bli arkitekt ändå, det skulle inte betyda något i slutändan.

Tji fick jag. När jag började studera på universitetet tog jag på mig att bygga en hemsida åt min programförening, vilket ledde mig in på wordpress. På denna tid fanns inga LLM:er och jag grottade verkligen ner mig i PHP och SQL igen. Det blev trots allt en fullt fungerande sida (som fortfarande fungerar, även om den ser ut som man kan förvänta sig) och mitt intresse för webb tog över.

Spola fram 5 år, jag studerar nu till AD på YRGO och vi har portfoliokurs. Jag blir än mer manisk. Satt uppe sent på nätterna, testade, knåpade och knådade. Resultatet blev väl en fullt respektabel presentationssida. Men jag kände alltid att jag ville mer, både estetiskt och kodmässigt. Jag ville ha ren kod, ett utseende som känns tidlöst och funktioner som jag tyckte var relevanta.

Koden blev allt bättre, jag hade börjat få en bra förståelse för modern CSS. Inga mer align: left/right, nu var det grid och variabler som styrde. Men jag hade problemet att jag skrev all kod i statiska dokument, det blev svårarbetat.


{{< lead >}}
De som träffat mig de senaste 3 åren vet att jag haft portfolion som en **permanent** punkt på min att-göra-lista.
{{< /lead >}}


Jag började leka med React, integrera routrar, sidövergångar, dynamisk text och byggde sakta upp ett eget ramverk. Med det även en syn på vad som är “bra” kod. När jag blivit varslad från Spöket återvände jag till Wordpress, men avskydde att ha en CMS och en föråldrad backend med så mycket bagage (ska tilläggas att jag idag tycker det är kul med WP, speciellt Gutenberg). Jag ville ha statiska sidor men utan att behöva handskas med all skit. Och då hittade jag [HUGO SSG](https://gohugo.io/), det jag arbetar med idag för att skapa sidan du besöker just nu.

---

## Vad är då resultatet?

En portfolio med stöd för case, blogg inlägg och diverse moduler. Sidan vilar på ett ***bespoke*** CSS-ramverk som jag är stolt över, allt på sidan styrs i stort sett genom ett variabelsystem som också grundar sig på enkel matte. Jag inkluderade Lenis för en premium scroll-känsla och har testat (och behövt täcka upp för) moderna CSS funktioner. Vill du kika igenom mitt HUGO-tema [kan du göra det här](https://github.com/ShortValleyHillhiker/vv-portf-theme).

### Sidan i kort

- HUGO SSG med Lenis, båda val gjorda med omsorg. Allt annat är skrivet av mig i enlighet med mina principer.
- Ett tema som automatiskt anpassar bildformat och storlekar för webben, jag kan ladda upp en 8k png och du levereras en skärmanpassad webp.
- Moderna CSS-funktioner som view transitions, @property och textsättning genom progress(). Samt @supports fallbacks om någon mot förmodan skulle besöka sidan med explorer 2016 (?)
- Idel WCAG AA-anpassning endast för att jag tycker det är intressant av tillgängligheten på webben.
- Separata posttyper som case och blogginlägg där jag kan visa upp tidigare arbeten.
- En “Om mig” sektion där jag försökt vara lite käck genom att skapa anpassade budskap till olika reklamarketyper.
- Och mycket mer, om du frågar kan jag hålla en monolog ack så mycket längre än detta inlägg.

