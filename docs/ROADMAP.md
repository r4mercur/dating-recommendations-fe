# Roadmap: Dating-Recommendations User Service

Übergabedokument für die weitere Umsetzung. **Neue Session: Diese Datei zuerst lesen, dann mit der nächsten offenen Phase weitermachen.**

- Backend (dieses Repo): Spring Boot 4.1, Java 24 (Gradle Toolchain), Postgres + Flyway, Kafka, Apache Solr, MinIO
- Frontend: `C:\Users\bjarn\WebstormProjects\dating-recommendations-fe` (Vue 3, Pinia, PrimeVue, Vite-Proxy `/api` → `localhost:8080`)

## Ziel

Das Backend soll alle Funktionen der Plattform abbilden:
1. Partnervorschläge auf Basis von Interessen/Hobbies und Standort (Solr)
2. Like-Typen (Like, Super-Like, …) und Matches
3. Messaging zwischen gematchten Usern

Kafka verteilt Events **zwischen** Komponenten/Services (statt REST-Calls). Echtzeit Browser ↔ Backend (Chat, Match-Benachrichtigung) läuft über **WebSockets**, Kafka liefert dahinter die Events.

## Entscheidungen (vom User getroffen)

| Thema | Entscheidung |
|---|---|
| Messaging | Im **selben** Backend-Service (als eigenes Modul, später herauslösbar) |
| Go-Recommendation-Service / Dating-Service (:3000) | **Entfällt.** Nur noch ein zentraler Service. Der Aufruf per RestTemplate ist bereits entfernt. |
| Like-Typen | `LIKE`, `SUPER_LIKE`, `COMPLIMENT` (Like mit Nachricht), `PASS`. Das Modell muss **leicht erweiterbar** sein (neue Typen ohne Umbau). |
| Standort | **Nur die Adressdaten, die der User einträgt** (PLZ/Stadt → Koordinaten). **Keine** Browser-Geolocation. |

## Zielarchitektur (modularer Monolith)

Schrittweise in fachliche Pakete umziehen, sobald ein Modul angefasst wird:

```
com.bjarne.datingrecommendationsuserservice
├── shared/        security (CurrentUser), error handling, kafka config
├── user/          Account, Profil, Präferenzen, Fotos, Standort
├── search/        Solr-Indexer (Kafka-Consumer) + Recommendation-Query
├── interaction/   Reactions (Like-Typen), Matches, Blocks
└── messaging/     Conversations, Messages, WebSocket
```

Kafka-Topics:

| Topic | Key | Producer | Consumer |
|---|---|---|---|
| `user-status-changed` (existiert) | userRef | user | search (aus Index entfernen), messaging |
| `user.profile-updated` | userRef | user | search (re-index) |
| `interaction.reaction-created` | targetRef | interaction | notifications |
| `interaction.match-created` | matchId | interaction | messaging (Conversation anlegen), notifications |
| `chat.message-sent` | conversationId | messaging | WebSocket-Fan-out, notifications |

Grundsatz: Zustand (Like, Match, Nachricht) wird **synchron in Postgres** gespeichert. Kafka transportiert nur die Folgewirkungen. Events werden per `@TransactionalEventListener(AFTER_COMMIT)` publiziert (siehe `UserStatusChangedProducer`).

---

## Phase 0 – Fundament ✅ erledigt

- Kafka: `spring-boot-starter-kafka` (Boot-4-Autokonfiguration) statt eigener Producer-Beans. Jackson-3-Serializer `JacksonJsonSerializer`/`JacksonJsonDeserializer`. `KafkaConfiguration` enthält nur noch Topics.
- DTOs statt Entities in allen Responses (Passwort-Hash wurde vorher ausgeliefert). Request-DTOs statt Entity im Body (vorher Mass-Assignment, z.B. `id` → Übernahme fremder Accounts möglich).
- Auth: JWT-`sub` = `referenceId` (Claim `email` zusätzlich). Endpunkte für den eingeloggten User liegen unter `/api/me` und nutzen `@CurrentUser String referenceId` (`security/CurrentUser.java`). Gesperrte (`BLOCKED`) oder gelöschte (`MARKED_FOR_DELETION`) Accounts können sich nicht einloggen.
- Update-Bug behoben (vorher neue `referenceId` bei jedem Update). Updates nur noch per `PATCH /api/me` (Teil-Update) und `PUT /api/me/password`.
- Fehlerbehandlung: `exception/GlobalExceptionHandler` liefert `ProblemDetail`. Dazu `NotFoundException` (404), `ConflictException` (409), `BadRequestException` (400).
- Flyway: `V1__initial_schema.sql` (bisheriges Hibernate-Schema) und `V2__unique_email_and_contact_index.sql`. `ddl-auto=validate`. Bestehende DBs werden auf V1 gebaselined.
- Tests: `UserServiceTest` (Unit) und `UserApiIntegrationTest` (Testcontainers: Postgres + Kafka, `disabledWithoutDocker`). Testprofil `application-test.properties`.
- Frontend: Login über `/api/auth/login` → Token → `GET /api/me`. `src/api.js` (`apiFetch`) schickt den Bearer-Token mit. Stores und Views sind auf die neuen Endpunkte umgestellt.

### Aktuelle API

| Methode & Pfad | Auth | Zweck |
|---|---|---|
| `POST /api/user` | – | Registrierung (`RegistrationRequest`) → `MyProfileResponse` (201) |
| `POST /api/auth/login` | – | `{username, password}` → `access_token` |
| `GET /api/me` / `PATCH /api/me` | ✔ | eigenes Profil lesen / teilweise ändern |
| `PUT /api/me/password` | ✔ | Passwort ändern |
| `PATCH /api/me/status` | ✔ | `ACTIVE`/`INACTIVE`/`MARKED_FOR_DELETION` (nicht `BLOCKED`) → Kafka-Event |
| `GET/POST /api/me/contacts` | ✔ | Kontakte (Like/Reject, Upsert) – wird in Phase 3 durch Reactions ersetzt |
| `GET /api/me/recommendations` | ✔ | Solr-Vorschläge (nur IDs) |
| `POST /api/me/photo` | ✔ | Profilbild-Upload (nur `image/*`) |
| `GET /api/user?referenceId=` | ✔ | öffentliches Profil (`UserProfileResponse`, nur aktive User) |
| `POST /api/user/search` | ✔ | mehrere öffentliche Profile |
| `GET /api/photos/{referenceId}` | ✔ | Redirect auf das Profilbild |

### Bekannte Restpunkte aus Phase 0
- V2 legt einen eindeutigen Index auf `lower(email)` an. Hat die lokale DB doppelte E-Mails, schlägt die Migration fehl. Dann die Duplikate löschen oder die DB neu aufsetzen.
- Solr wird weiter **synchron** im `UserService` indexiert (`TODO Phase 2`). Statuswechsel entfernen User noch nicht aus dem Index.
- MinIO-Presigned-URLs (7 Tage gültig) stehen in der DB → Phase 1.
- `UserStatusChangedConsumer` loggt nur (Demo).
- Ein End-to-End-Test im Browser mit dem kompletten Stack (Solr, MinIO) steht noch aus.

---

## Phase 1 – Profil & Standort ⏭ als Nächstes

- Neue Felder: `bio`, `birthDate` (ersetzt `age`, Alter wird berechnet), `latitude`/`longitude`.
- Präferenzen: gesuchte Geschlechter, Altersspanne (min/max), maximale Distanz (km). Eigene Tabelle oder Embeddable, Flyway-Migration `V3__…`.
- Interessen/Hobbies als **fester Tag-Katalog** (Tabelle `tags` mit Kategorie, `GET /api/tags`). Das Frontend nutzt ein Multiselect. Werte normalisiert (lowercase).
- **Geocoding nur aus Adressdaten:** PLZ → Koordinaten über eine lokale Tabelle (z.B. GeoNames Postal Codes DE, Import per Flyway). Keine externe API, keine Browser-Geolocation. Bei Registrierung und Adressänderung Koordinaten setzen. Das Dev-Seeding (`DevDataSeedRunner`) nutzt echte PLZ aus der Tabelle.
- Fotos: in der DB nur den MinIO-Object-Key speichern (Dateiname als UUID), die URL beim Auslesen frisch signieren.
- Frontend: Registrierung und Profil um die neuen Felder erweitern.

## Phase 2 – Recommendations v2 (Solr)

- Schema in `SolrConfiguration`: `location` (Typ `location`), `status`, `birthDate`, `gender`, `seekingGenders`, Tags lowercase.
- Indexierung **nur per Kafka-Consumer** auf `user.profile-updated` und `user-status-changed` (inaktive/blockierte User aus dem Index entfernen). Dazu ein Admin-Endpoint oder Job für einen vollständigen Re-Index.
- Query (edismax):
    - Filter (`fq`): `status:ACTIVE`, Gender- und Altersfilter in beide Richtungen (passe ich zu ihren Präferenzen und sie zu meinen), `{!geofilt}` für die Distanz, `-{!terms f=referenceId}` für bereits bewertete User
    - Score: Boost für überlappende Tags plus Distanz-Boost `recip(geodist(),…)`
- `GET /api/me/recommendations?cursor=…` liefert direkt **ProfileCards** mit `distance` und `compatibility` (Felder, die `ProfileTile.vue` schon erwartet). Der zweite Call über `/api/user/search` entfällt im Frontend.

## Phase 3 – Like-Typen & Matches

- `Reaction(from, to, type, message?, createdAt)` mit Unique-Constraint (from, to). Der Typ wird als String gespeichert. Erweiterbarkeit: Typ-Eigenschaften (zählt als positiv, Tageslimit, erlaubt Nachricht) zentral definieren, z.B. als Enum mit Attributen oder als Konfiguration, damit ein neuer Typ nur ein neuer Eintrag ist.
- Tageslimit für `SUPER_LIKE` konfigurierbar.
- Match-Erkennung **in derselben Transaktion** (Gegen-Like vorhanden → `Match` anlegen), danach `interaction.match-created` publizieren.
- Endpunkte: `POST /api/me/reactions`, `GET /api/me/matches`, `GET /api/me/likes-received`, `DELETE /api/me/matches/{id}` (Unmatch), `POST /api/me/blocks`.
- Das `Contact`-Modell per Flyway-Migration ablösen. Im Frontend `sendLike`/`sendRejection` umstellen.

## Phase 4 – Messaging (im selben Service)

- `Conversation` (wird automatisch beim Match per Kafka-Consumer angelegt) und `Message(id, conversationId, sender, content, createdAt, readAt)`.
- REST: `GET /api/me/conversations` mit Last Message und Unread-Count, `GET /api/conversations/{id}/messages?before=…` mit Cursor-Pagination.
- WebSocket/STOMP: `/ws` mit JWT-Auth beim CONNECT. Senden über `/app/chat.send`, Empfangen über `/user/queue/messages`. Lesebestätigungen.
- Nachrichten nur zwischen gematchten, nicht blockierten Usern. Erst in Postgres speichern, dann `chat.message-sent` (Key `conversationId`) → Fan-out an die WebSocket-Sessions.
- Frontend: Mock-Daten in `Chat.vue`/`ChatMenu.vue` ersetzen, den Call auf `localhost:8081/create-chat` in `ChatModal.vue` entfernen.

## Phase 5 – Feinschliff

Notifications (WebSocket-Push für Match und Like), Report-Funktion, Rate-Limiting, Actuator/Metriken, OpenAPI per springdoc.

---

## Konventionen & Hinweise für Agents

- Responses immer als DTO-Record mit statischem `from(...)`, nie Entities. Requests als validierte Records.
- Der eingeloggte User kommt immer aus `@CurrentUser`, nie aus Pfad oder Body.
- Fehler über die Exceptions in `exception/` werfen, nicht `IllegalArgumentException` → 500.
- Schemaänderungen nur per neuer Flyway-Migration (`V3__…`), bestehende Migrationen nie ändern.
- Spring Boot 4 ist modular: Autokonfiguration braucht den passenden Starter (`spring-boot-starter-kafka`, `-flyway`, Tests: `spring-boot-starter-webmvc-test`). Jackson 3 (`tools.jackson`), Annotationen weiter `com.fasterxml.jackson.annotation`.
- Testcontainers 2.x: `org.testcontainers.postgresql.PostgreSQLContainer`, `org.testcontainers.kafka.KafkaContainer`.
- Tests: `./gradlew test` (Integrationstests brauchen laufendes Docker Desktop). Lokal starten: `./gradlew bootRun --args='--spring.profiles.active=dev'` (startet `compose.yaml` automatisch).
- Auf dem Entwicklerrechner (Windows) ist kein Python installiert. Für Skripte Bash oder PowerShell nutzen.
