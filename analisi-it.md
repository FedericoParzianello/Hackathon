# Analisi funzionale — CRM proattivo con agenti

**Versione 0.1 · documento da validare prima di costruire**
Fonte di verità modificabile: [`spec/product-spec.yaml`](../spec/product-spec.yaml)

---

## 1. Sintesi esecutiva

Non vi serve un CRM. Vi serve un **sistema di lavoro commerciale** che risolva tre cose che oggi si perdono per strada:

1. Che **tutto il portafoglio** venga a conoscenza di ogni nuovo modulo, e poterlo dimostrare con un numero.
2. Che **nessun interesse si raffreddi**: se qualcuno alza la mano, esiste un'opportunità, un titolare e un orologio che scorre.
3. Che il venditore arrivi il lunedì e **trovi il lavoro già preparato**: le 15 azioni di maggior valore, ordinate, con il contesto e la bozza già scritti.

La differenza rispetto a un CRM classico non è il database: è che **il lavoro amministrativo lo fanno gli agenti** e l'essere umano decide e parla con il cliente. Il CRM propone, il venditore approva.

Tre scommesse da validare oggi:

| # | Scommessa | Come si vede nel prodotto |
|---|-----------|---------------------------|
| T1 | Il CRM dice cosa fare e prepara il lavoro | Schermata "La Mia Settimana" con azioni prioritizzate e bozze |
| T2 | Ogni lancio è una campagna a ondate con copertura | Dashboard di copertura per ondata, modulo e venditore |
| T3 | Ogni interazione è un segnale con punteggio che attiva un'azione con SLA | Inbox interesse con timer e creazione automatica dell'opportunità |

---

## 2. Contesto e vincoli di business

Questi vincoli condizionano tutto il design e vanno confermati:

- **Non c'è self-service.** Il cliente non attiva i moduli via web. C'è sempre un'azione commerciale prima e una negoziazione. Conseguenza: l'obiettivo del prodotto **non è un carrello**, è **generare e non perdere conversazioni qualificate**.
- **Cross-selling sulla base installata.** Il movimento principale è vendere nuovi moduli a clienti che avete già. Conseguenza: l'entità centrale non è il *lead*, è l'**azienda cliente** e i suoi **gap di modulo**.
- **Portafoglio assegnato.** Ogni venditore ha le sue aziende. Conseguenza: l'assegnazione non si decide per campagna, si **eredita dal portafoglio** (e vanno definite le eccezioni).
- **Il webinar è il motore della domanda.** Conseguenza: il webinar non è un evento di marketing isolato, è la **fonte principale di segnali** e deve stare dentro il CRM, non in un foglio a parte.

---

## 3. Problemi attuali → cosa costruiamo

| Problema di oggi | Cosa costruiamo |
|---|---|
| Dopo un webinar è impossibile seguire chi ha contattato e chi è rimasto a metà | Spazio webinar: iscrizioni, presenze, minuti e domande → segnali automatici e un task per partecipante |
| Non sappiamo se il lancio ha raggiunto tutto il portafoglio | Campagne con **target espliciti per ondata** e metrica di copertura (%) per venditore |
| Il venditore non sa cosa fare questa settimana | Piano settimanale generato dall'agente con `priority_score` spiegabile |
| Il CRM diventa obsoleto perché aggiornarlo è lavoro manuale | Agente aggiornatore: nota libera o trascrizione → fase, importo, obiezione, prossimo passo |
| Non c'è una lettura affidabile del successo per campagna | Funnel per campagna/modulo/venditore + report narrativo dell'agente analista |
| Se qualcuno mostra interesse e nessuno chiama entro 24h, si perde | Cattura dell'interesse con link univoco → opportunità + task con SLA di 4h + notifica |

---

## 4. I sei flussi da costruire

### F1 · Lancio di un nuovo modulo

1. Prodotto/Marketing crea il **modulo** nel catalogo con proposta di valore, segmenti target, prezzo e moduli prerequisito.
2. Crea una **campagna** con obiettivo misurabile (es. "40 opportunità e 250 k€ di ARR in 8 settimane").
3. L'**Agente Segmentatore** attraversa il portafoglio, calcola il `fit_score` di ogni azienda per quel modulo, esclude chi lo ha già, e propone le **ondate** (ondata 1 = miglior fit, per imparare in fretta).
4. Ogni target viene assegnato **al venditore titolare dell'azienda**. L'agente redige un messaggio personalizzato usando dati reali (quali moduli ha, quale problema gli risolverebbe).
5. Il venditore rivede il suo lotto nella console agenti: **approvare / modificare / scartare** in blocco.
6. Si generano i task di primo contatto con scadenza. La copertura inizia a contare.

> **Chiave di design:** la copertura non è "email inviate", è **target con primo contatto reale registrato**. È il numero che oggi non avete.

### F2 · Il webinar come fabbrica di segnali

- **Prima:** l'agente invita la lista target dell'ondata, ricorda a T-1 giorno e avvisa il venditore su chi del suo portafoglio si è iscritto.
- **Durante:** si registrano domande e risposte ai sondaggi.
- **Dopo (T+2h):** l'agente incrocia presenze, minuti visti e domande; genera un segnale per partecipante; scrive **un riepilogo per azienda** e **una bozza di follow-up che cita la domanda posta da quella persona**; e crea i task: SLA 24h per chi ha fatto domande, 48h per gli altri presenti, e un'azione di "invio registrazione" per i no-show.

È esattamente ciò che oggi "è impossibile da seguire": da due giorni di lavoro a venti minuti di revisione.

### F3 · Cattura dell'interesse senza self-service

Poiché non esiste l'attivazione via web, il "sì" del cliente deve essere **un clic che genera lavoro commerciale**, non un acquisto:

- Ogni email contiene un **link univoco per contatto e modulo** ("Mi interessa, contattatemi" / "Voglio vederlo sul mio caso" / "Non ora, ricontattatemi tra 6 mesi").
- Il clic scrive un segnale di peso 40, e l'**Agente Cacciatore di Segnali** lo elabora in meno di 15 minuti: crea l'opportunità in fase *Interesse manifestato*, apre un task con **SLA di 4 ore** al venditore titolare e gli invia tutto il contesto.
- La schermata **Inbox interesse** mostra i segnali caldi non gestiti con un timer. Se il timer scade, la sentinella escala al manager.
- "Non ora" non si perde: crea un'opportunità *parcheggiata* con data di riattivazione automatica.

### F4 · Focus settimanale del venditore

Lunedì 07:00 l'**Agente Copilota** genera il piano di ogni venditore:

- Prende tutte le azioni possibili (interessi caldi, SLA in scadenza, proposte senza follow-up, target di campagna non contattati, parcheggiati in scadenza).
- Assegna a ciascuna un `priority_score = (ARR potenziale/1000) × probabilità di fase × urgenza SLA × peso del tipo di azione × fattore di interesse`.
- Seleziona le **15 migliori** (configurabile), le **raggruppa per tipo** per lavorare a blocchi ("6 chiamate di follow-up webinar", "3 proposte da chiudere") e allega script e bozza.
- Venerdì 16:00: chiusura con retrospettiva — cosa è stato fatto, cosa no e perché. Quel dato ricalibra l'agente.

> **Regola anti-CRM-tradizionale:** il venditore non cerca dentro liste. Apre una schermata con il lavoro di oggi e lo smaltisce.

### F5 · Aggiornamento senza lavoro manuale

- Dopo una chiamata il venditore detta o scrive quattro righe.
- L'**Agente Aggiornatore** estrae: nuova fase, importo, obiezioni rilevate, prossimo passo e data, e propone la modifica da confermare con un clic.
- Se manca qualcosa di critico (data di chiusura, importo), chiede **solo quello**.
- Se non ha informazioni sufficienti non inventa: segna il task come *richiede giudizio umano*.

### F6 · Misurazione di campagne e portafoglio

Due letture diverse, due schermate diverse:

- **Per campagna:** copertura per ondata, funnel (target → contattato → interessato → riunione → proposta → vinto), tasso di interesse per messaggio (A/B), ARR generato, costo per opportunità, confronto tra ondate.
- **Per venditore e portafoglio:** penetrazione di ogni modulo nel suo portafoglio, SLA rispettati, aderenza al piano settimanale, funnel personale, previsione.

E sopra a tutto, l'**Agente Analista** scrive ogni settimana in linguaggio naturale cosa funziona e cosa raccomanda per l'ondata successiva. È quello che la direzione porta in comitato.

---

## 5. Modello dei dati (sintesi)

Entità e ragione per cui esistono. Il dettaglio dei campi è nello YAML.

| Entità | Perché esiste |
|---|---|
| `users` | Venditori e manager, con quota e **capacità settimanale** (limita il piano) |
| `accounts` | Unità di portafoglio: segmento, settore, paese, ARR, salute, titolare |
| `contacts` | Persone con ruolo decisionale, lingua e **consenso** |
| `modules` | Catalogo vendibile: proposta di valore, prezzo, prerequisiti |
| `account_modules` | Ciò che ogni azienda ha già → da qui nascono i **gap di cross-selling** |
| `campaigns` / `campaign_waves` | Lancio con obiettivo, budget e ondate |
| `campaign_targets` | Azienda target con `fit_score`, titolare e stato → **la copertura nasce qui** |
| `events` / `event_registrations` | Webinar, presenze reali, minuti e domande |
| `signals` | Log *append-only* dell'interesse. **Nucleo del sistema**: nulla si cancella, tutto pesa |
| `opportunities` | Vendita di un modulo a un'azienda, con campagna e segnale di origine |
| `activities` | Task e interazioni con SLA e `priority_score` |
| `interactions` | Chiamate/email con riepilogo e obiezioni rilevate |
| `weekly_plans` | Focus settimanale impegnato e sua aderenza |
| `agent_runs` | Tracciabilità di ogni agente: cosa ha proposto, cosa è stato accettato, quanto è costato |
| `templates` / `playbooks` | Messaggi per lingua e argomentario per modulo |

**Fasi del funnel:** Target → Contattato → Interesse manifestato → Riunione fissata → Demo/analisi → Proposta → Negoziazione → Vinto / Perso / Parcheggiato.

---

## 6. Gli agenti

| Agente | Quando agisce | Cosa consegna | Autonomia |
|---|---|---|---|
| Segmentatore di lancio | Alla creazione della campagna | Target per ondata, assegnati, con messaggio personalizzato | Propone |
| Gestore webinar | T-7g, T-1g, T+2h | Inviti, segnali, riepilogo per azienda, bozze, task | Propone e invia dopo approvazione |
| Cacciatore di segnali | Ogni 15 min | Opportunità + task con SLA + notifica con contesto | Autonomo |
| Copilota del piano settimanale | Lunedì 07:00 / venerdì 16:00 | Piano di 15 azioni e retrospettiva | Propone |
| Aggiornatore CRM | Al salvataggio di una nota | Fase, importo, obiezioni, prossimo passo | Propone e conferma |
| Sentinella dello stallo | Giornaliero 06:00 | SLA non rispettati, deal dormienti, escalation al manager | Autonomo |
| Analista di campagna | Settimanale / a chiusura | Report narrativo e raccomandazione per l'ondata successiva | Autonomo |
| Preparatore di riunione | 12h prima | Brief di una pagina con segnali, domande e obiezioni probabili | Autonomo |

**Guardrail (non negoziabili):**

- Nulla esce verso il cliente senza approvazione umana, salvo la whitelist (invito, promemoria, registrazione).
- Tutto resta registrato in `agent_runs` con input, output e decisione umana.
- Massimo 2 contatti per azienda a settimana, e rispetto assoluto di disiscrizioni e consensi.
- Se l'agente ha dubbi, non inventa: segna *richiede giudizio umano*.
- Il **tasso di accettazione** delle proposte dell'agente è un KPI di prodotto: se scende sotto il 70 %, l'agente si ricalibra.

---

## 7. Come si assegnano i punteggi (questo è il prodotto)

**`fit_score` (0-100)** — chi contattare prima con un modulo:
prerequisiti già attivi (30) + match di segmento (20) + livello di utilizzo del prodotto base (20) + match di settore (15) + salute dell'azienda (15).

**`interest_score` (0-100)** — interesse vivo, con decadimento del 10 % a settimana:
clic "mi interessa" 40 · risposta a email 25 · presenza al webinar 25 · domanda al webinar 20 · menzione in chiamata 20 · iscrizione 15 · download 10 · visita alla pagina del modulo 8 · apertura 3.
Soglie: **40 = interesse qualificato** (si crea opportunità e task), **70 = caldo** (SLA breve e notifica al manager).

**`priority_score`** — ordine del piano settimanale:
`(ARR potenziale/1000) × probabilità di fase × urgenza SLA × peso del tipo di azione × fattore di interesse`, con urgenza ×2,0 se scaduto, ×1,5 se scade oggi, ×1,2 questa settimana.

> Questi pesi stanno nello YAML proprio perché il direttore commerciale li discuta e li cambi. **Lì si definisce la cultura di vendita dell'azienda**, non nel codice.

---

## 8. KPI per validare che funzioni

| KPI | Obiettivo iniziale |
|---|---|
| Copertura di campagna | ≥ 95 % in 3 settimane |
| Tempo di prima risposta dopo segnale caldo | < 4 h |
| Segnale qualificato → riunione | ≥ 35 % |
| Riunione → proposta | ≥ 50 % |
| Aderenza al piano settimanale | ≥ 80 % |
| Accettazione delle proposte dell'agente | ≥ 70 % |
| Ore amministrative risparmiate per venditore/settimana | ≥ 3 h |
| ARR incrementale per modulo e campagna | da definire con la direzione |

---

## 9. Architettura tecnica

- **Frontend/backend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, server actions.
- **Dati:** Postgres gestito (Neon o Supabase) + Drizzle ORM, migrazioni versionate nel repo.
- **Auth:** Auth.js con magic link, ruoli venditore / manager / admin.
- **Deploy:** Vercel, preview automatica per ogni PR di GitHub, produzione su `main`.
- **Agenti:** Anthropic SDK con *tool use*. Ogni agente = prompt versionato nel repo + set di strumenti (`cerca_aziende`, `crea_task`, `aggiorna_opportunita`, `redigi_messaggio`...). Esecuzione periodica con **Vercel Cron** e coda idempotente.
- **Email:** Resend con webhook di apertura e clic (è così che entrano i segnali).
- **Osservabilità:** tabella `agent_runs` + costo per agente. Senza questo la parte agentica non è vendibile.
- **Repo:** GitHub, GitHub Actions per lint, test e migrazioni.

**Principio architetturale:** il CRM è un **log di segnali + un motore di regole + agenti che leggono e scrivono via API**. Se un agente può farlo, lo fa attraverso la stessa API usata dall'interfaccia. Nessuna logica nascosta nella UI.

---

## 10. Perimetro per l'hackathon

**Indispensabile (demo end-to-end):**

1. Portafoglio: aziende, contatti, moduli attivi e gap.
2. Creare una campagna di modulo → l'agente propone i target per ondate.
3. Webinar: importare il CSV delle presenze → segnali automatici.
4. Pulsante "mi interessa" con link univoco → opportunità + task con SLA.
5. "La Mia Settimana" con prioritizzazione reale e bozze.
6. Dashboard di campagna con copertura e funnel.

**Desiderabile:** console agenti con approvazione in blocco · agente aggiornatore da nota libera · report narrativo di campagna.
**Se resta tempo:** multilingua completo · sentinella dello stallo · preparatore di riunione.
**Fuori perimetro:** integrazione reale con ERP, fatturazione, app mobile, portale di self-service.

**Ripartizione suggerita (due persone, ~30 h):**

| Fase | Contenuto | Ore |
|---|---|---|
| 0 | Repo, spec, schema, dati sintetici credibili (400 aziende, 6 moduli, 8 venditori) | 3 |
| 1 | Portafoglio e catalogo: scheda azienda 360 e gap di modulo | 4 |
| 2 | Campagne, ondate e agente segmentatore | 6 |
| 3 | Webinar, import presenze, segnali e pulsante interesse | 6 |
| 4 | Opportunità, task, `priority_score` e "La Mia Settimana" | 6 |
| 5 | Dashboard di campagna e report dell'agente analista | 3 |
| 6 | Dati demo con narrativa, rifinitura e prova | 2 |

---

## 11. Copione della demo (5 minuti)

1. "Lanciamo il modulo X." L'agente valuta 400 aziende e propone l'ondata 1 di 80, già assegnate per portafoglio.
2. Approvazione con un clic → task e messaggi personalizzati per ogni venditore.
3. "Webinar concluso": importiamo le presenze; 12 domande diventano 12 segnali con follow-up già redatto.
4. Un cliente clicca "mi interessa": appare nell'inbox con SLA di 4 h e bozza pronta.
5. Lunedì: il venditore apre "La Mia Settimana" con 15 azioni ordinate per valore atteso ed esegue tre di fila.
6. Il direttore vede copertura al 96 %, funnel per modulo e il report dell'agente analista.

Chiusura: *"Prima erano due giorni di Excel per ogni webinar e un lunedì di dubbi. Ora sono venti minuti di approvazione."*

---

## 12. Rischi e decisioni aperte

**Rischi**

| Rischio | Mitigazione |
|---|---|
| Il venditore non si fida dell'agente e lo ignora | Tutto spiegabile ("perché questa azione"), approvazione in blocco, KPI di accettazione |
| Saturazione del portafoglio con troppi messaggi | Limite di 2 contatti/azienda/settimana applicato dal motore, non dalla buona volontà |
| Dati di partenza sporchi → `fit_score` scadente | Fase 0 di pulizia e ERP come fonte di verità dei moduli attivi |
| L'agente inventa dati del cliente | Divieto esplicito, marcatura *richiede giudizio umano*, tracciabilità |
| Perimetro eccessivo nell'hackathon | I 6 indispensabili, il resto si mostra come design, non come codice |

**Decisioni da chiudere**

1. L'assegnazione è per azienda o per azienda+modulo? (definisce chi segue ogni interesse)
2. Un agente può inviare email a freddo senza approvazione? *Proposta: no.*
3. Il successo della campagna si misura in opportunità create o in ARR firmato?
4. Fonte di verità dei moduli attivi: CRM o ERP?
5. Cosa succede con un interesse su un'azienda che non è nel tuo portafoglio?

---

## 13. Quali dati mi servono da voi

Sono in un file a parte, pronto da compilare: [`spec/datos-necesarios.md`](../spec/datos-necesarios.md).
Il minimo per costruire qualcosa di credibile in hackathon: **catalogo dei moduli, un campione anonimizzato di 50 aziende con i moduli attivi, elenco dei venditori, fasi reali del funnel e un CSV di presenze di un webinar reale.**
