# Project Estimation - GeoControl Revised

Date: 2025-04-16
Version: 1.0

# Estimation approach

Considerando il progetto GeoControl, descritto nello swagger, si assume lo sviluppo completo del progetto in maniera indipendente dalle scadenze del corso e da zero.

# Estimate by size
###
|                                                                           | Estimate                     |
|---------------------------------------------------------------------------|------------------------------|
| NC = Numero stimato di classi da sviluppare                               | 10                           |
| A = Dimensione media per classe, in LOC                                   | 150                          |
| S = Dimensione stimata del progetto, in LOC (NC * A)                      | 1500                         |
| E = Sforzo stimato, in ore uomo (con produttività di 10 LOC per ora uomo) | 150 ore uomo                 |
| C = Costo stimato, in euro (1 ora uomo = 30 euro)                         | €4.500                       |
| Tempo di calendario stimato                                               | ~1 settimana                 |

# Estimate by product decomposition
###
| Componente                | Sforzo stimato (ore uomo) |
|---------------------------|---------------------------|
| Requirement document      | 55                        |
| Design document           | 20                        |
| Code                      | 125                       |
| Unit tests                | 40                        |
| API tests                 | 140                       |
| Management documents      | 8                         |

# Estimate by activity decomposition
###
| Attività                               | Sforzo stimato (ore) |
|----------------------------------------|----------------------|
| Creazione delle classi base            | 30                   |
| Implementazione della logica           | 40                   |
| Test unitari e integrazione            | 50                   |
| Documentazione e gestione del progetto | 10                   |

## Estimated timeline
![Gantt Chart](/images/gantt.png)

# Summary
###
|                                       | Sforzo stimato       | Durata stimata         |
|---------------------------------------|----------------------|------------------------|
| Stima per dimensioni                  | 150 ore uomo         | ~1 settimana           |
| Stima per decomposizione del prodotto | 388 ore uomo         | ~2,4 settimane         |
| Stima per decomposizione per attività | 130 ore uomo         | ~0,8 settimane         |

**Commento:**
La stima in base alle dimensioni considera soltanto il codice e rischia di sottostimare il lavoro complessivo. La stima per decomposizione del prodotto include anche le attività accessorie e la documentazione, risultando in una stima superiore. La stima per decomposizione per attività analizza le singole fasi operative, ma potrebbe non includere in toto eventuali ritardi o integrazioni aggiuntive.
