  define(function () {
      var out = {};

      // translations must set this key for their language to be available in
      // the language dropdowns that are shown throughout Cryptpad's interface
      out._languageName = 'German';

      out.main_title = "Cryptpad: Echtzeitzusammenarbeit, ohne Preisgabe von Informationen";
      out.main_slogan = "Einigkeit ist Stärke - Zusammenarbeit der Schlüssel"; // Der Slogan sollte evtl. besser englisch bleiben.

      out.type = {};
      out.type.pad = 'Pad';
      out.type.code = 'Code';
      out.type.poll = 'Umfrage';
      out.type.slide = 'Präsentation';

      out.common_connectionLost = 'Serververbindung verloren';

      out.disconnected = 'Getrennt';
      out.synchronizing = 'Synchronisiert';
      out.reconnecting = 'Verbindung wird neu aufgebaut...';
      out.lag = 'Lag';
      out.readonly = 'Nur-Lesen';
      out.anonymous = "Anonymous";
      out.yourself = "Du";
      out.anonymousUsers = "anonyme Nutzer*innen";
      out.anonymousUser = "anonyme Nutzer*in";
      out.users = "Nutzer*innen";
      out.and = "Und";
      out.viewer = "Betrachter*in";
      out.viewers = "Betrachter*innen";
      out.editor = "Bearbeiter*in";
      out.editors = "Bearbeiter*innen";

      out.greenLight = "Alles funktioniert bestens";
      out.orangeLight = "Deine langsame Verbindung kann die Nutzung beinträchtigen";
      out.redLight = "Du wurdest von dieser Sitzung getrennt";

      out.importButtonTitle = 'Importiere eine lokale Datei in dieses Dokument';

      out.exportButtonTitle = 'Exportiere dieses Dokument in eine lokale Datei';
      out.exportPrompt = 'Wie möchtest du die Datei nennen?';


      out.changeNamePrompt = 'Ändere deinen Namen (oder lasse dieses Feld leer um anonym mitzuarbeiten): ';

      out.clickToEdit = "Zum Bearbeiten klicken";

      out.forgetButtonTitle = 'Entferne dieses Dokument von deiner Startseitenliste';
      out.forgetPrompt = 'Mit dem Klick auf OK wird das Dokument aus deinem lokalen Speicher gelöscht. Fortfahren?';

      out.shareButton = 'Teilen';
      out.shareSuccess = 'Die URL wurde in die Zwischenablage kopiert';

      out.presentButtonTitle = "Präsentationsmodus starten";
      out.presentSuccess = 'Drücke ESC um den Präsentationsmodus zu verlassen!';

      out.backgroundButtonTitle = 'Die Hintergrundfarbe der Präsentation ändern';
      out.colorButtonTitle = 'Die Textfarbe im Präsentationsmodus ändern';

      // Hierfür fehlt eine passende Übersetzung...

      out.editShare = "Mitarbeits-URL teilen";
      out.editShareTitle = "Mitarbeits-URL in die Zwischenablage kopieren";
      out.viewShare = "Nur-Lesen-URL teilen";
      out.viewShareTitle = "Nur-Lesen-URL in die Zwischenablage kopieren";
      out.viewOpen = "In neuem Tab anzeigen";
      out.viewOpenTitle = "Dokument im Nur-Lesen-Modus in neuem Tab öffnen.";

      out.notifyJoined = "{0} ist der gemeinsamen Sitzung beigetreten";
      out.notifyRenamed = "{0} heißt nun {1}";
      out.notifyLeft = "{0} hat die gemeinsame Sitzung verlassen";

      out.tryIt = 'Probier\'s aus!';

      out.okButton = 'OK (Enter)';
      out.cancelButton = 'Abbrechen (ESC)';

      // Polls

      out.poll_title = "Datumsplaner ohne Preisgabe von Infos";
      out.poll_subtitle = "<em>Echtzeit</em>-planen ohne Preisgabe von Infos";

      out.poll_p_save = "Deine Einstellungen werden sofort automatisch gesichert.";
      out.poll_p_encryption = "Alle Eingaben sind verschlüsselt, deshalb haben nur Leute im Besitz des Links Zugriff. Selbst der Server sieht nicht was du änderst.";

      out.wizardLog = "Klicke auf den Button links oben um zur Umfrage zurückzukehren.";
      out.wizardTitle = "Nutze den Assistenten um deine Umfrage zu erstellen.";
      out.wizardConfirm = "Bist du wirklich bereit die angegebenen Optionen bereits zu deiner Umfrage hinzuzufügen?";


      out.poll_publish_button = "Veröffentlichen";
      out.poll_admin_button = "Admin";
      out.poll_create_user = "Neuen Benutzer hinzufügen";
      out.poll_create_option = "Neue Option hinzufügen";
      out.poll_commit = "Einchecken";

      out.poll_closeWizardButton = "Assistent schließen";
      out.poll_closeWizardButtonTitle = "Assistent schließen";
      out.poll_wizardComputeButton = "Optionen übernehmen";
      out.poll_wizardClearButton = "Tabelle leeren";
      out.poll_wizardDescription = "Erstelle die Optionen automatisch, indem du eine beliebige Anzahl von Daten und Zeiten eingibst.";
      out.poll_wizardAddDateButton = "+ Daten";
      out.poll_wizardAddTimeButton = "+ Zeiten";

      out.poll_optionPlaceholder = "Option";
      out.poll_userPlaceholder = "Dein Name";
      out.poll_removeOption = "Bist du sicher, dass du diese Option entfernen möchtest?";
      out.poll_removeUser = "Bist du sicher, dass du diese(n) Nutzer*in entfernen möchtest?";

      out.poll_titleHint = "Titel";
      out.poll_descriptionHint = "Beschreibe deine Abstimmung und publiziere sie mit dem 'Veröffentlichen'-Knopf wenn du fertig bis. Jeder mit dem Link kann die Beschreibung ändern.";

      // index.html

      out.main_howitworks = 'Wie es funktioniert';
      out.main_p2 = 'Dieses Projekt nutzt den <a href="http://ckeditor.com/">CKEditor</a> visuellen Editor, <a href="https://codemirror.net/">CodeMirror</a>, und die <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> realtime engine.';
      out.main_howitworks_p1 = 'CryptPad nutzt eine Variante des <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> Algorithmus. Dieser kann mit Hilfe der <a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a>, einem Konstrukt, das durch das <a href="https://de.wikipedia.org/wiki/Bitcoin">Bitcoin</a>-Projekt Bekanntheit erlangte, verteilten Konsens (distributed consensus) finden. Damit ist der Algorithmus nicht auf einen zentralen Server angewiesen um Konflikte zu lösen &mdash; der Server muss also nichts vom Inhalt der Pads wissen.';

      out.main_about_p2 = 'Für Fragen und Kommentare kannst du uns <a href="https://twitter.com/cryptpad">tweeten</a>, ein Ticket <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">auf Github öffnen</a>, hi auf irc sagen (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), oder <a href="mailto:research@xwiki.com">eine Mail zukommen lassen</a>.';

      out.button_newpad = 'Neues WYSIWYG-Pad erstellen';
      out.button_newcode = 'Neues Code-Pad erstellen';
      out.button_newpoll = 'Neue Abstimmung erstellen';
      out.button_newslide = 'Neue Präsentation erstellen';

      // privacy.html

      out.policy_title = 'Cryptpad Datenschutzbestimmungen';
      out.policy_whatweknow = 'Was wir über dich wissen';
      out.policy_whatweknow_p1 = 'Als Programm, das im Web gehostet wird, hat Cryptpad Zugriff auf die Metadaten, die vom HTTP-Protokoll exponiert werden. Inbegriffen ist deine IP-Adresse und diverse andere HTTP-Header, die es ermöglichen deinen Browser zu identifizieren. Um zu sehen welche Daten dein Browser preis gibt kanst du die Seite <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a> besuchen.';
      out.policy_whatweknow_p2 = 'Wir nutzen <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, eine open source Analyseplatform um mehr über unsere Nutzer*innen zu lernen. Piwik teilt uns mit, wie du Cryptpad gefunden hast &mdash; durch direkten Zugriff, mit Hilfe eine Suchmaschine oder über einen Link auf einer anderen Seite wie z.B. Reddit oder Twitter. Außerdem lernen wir mehr über deinen Besuch, welchen Link du auf den Informationsseiten klickst und wie lange du auf diesen Seiten verweilst.';
      out.policy_howweuse = 'Wie wir das Wissen anwenden';
      out.policy_howweuse_p1 = 'Wir nutzen diese Informationen um besser entscheiden zu können wie Cryptpad beworben werden kann und um genutzte Strategien zu evaluieren. Informationen über deinen Standort helfen uns abzuschätzen welche Sprachen wir besser unterstützen sollten.';
      out.policy_howweuse_p2 = "Informationen zu deinem Browser (ob du auf einem Desktop oder Smartphone arbeitest) hilft uns außerdem dabei zu entscheiden, welche Features priorisiert werden sollen. Unser Entwicklerteam ist klein, deshalb ist es uns wichtig Entscheidungen derart zu treffen, dass die Erfahrung der größten Zahl von Nutzer*innen verbessert wird.";
      out.policy_whatwetell = 'Was wir anderen über die erzählen';
      out.policy_whatwetell_p1 = 'Wir reichen keine von uns gesammelten Daten weiter, außer im Falle einer gerichtlichen Anordnung.';
      out.policy_links = 'Links zu anderen Seiten';
      out.policy_links_p1 = 'Diese Seite beinhaltet Links zu anderen Seiten, teilweise werden diese von anderen Organisationen verwaltet. Wir sind nicht für den Umgang mit der Privatsphäre und die Inhalte der anderen Seiten verantwortlich. Generell werden Links zu externen Seiten in einem neuem Fenster geöffnet, um zu verdeutlichen, dass du Cryptpad.fr verlässt.';
      out.policy_ads = 'Werbung';
      out.policy_ads_p1 = 'Wir zeigen keine Onlinewerbung, können aber zu Organisationen verlinken, die unsere Forschung finanzieren.';
      out.policy_choices = 'Deine Möglichkeiten';
      out.policy_choices_open = 'Unser Code ist open source, deshalb kannst du jederzeit deine eigene Cryptpad-Instanz hosten.';
      out.policy_choices_vpn = 'Wenn du unsere gehostete Instanz nutzen möchtest bitten wir dich darum IP-Adresse zu verschleiern, das geht zum Beispiel mit dem <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads vor Torproject" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, oder einem <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN-Zugang</a>.';
      out.policy_choices_ads = 'Wenn du unsere Analysesoftware blockieren möchtest kannst du Adblock-Software wie <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a> verwenden.';

      // terms.html

      out.tos_title = "Cryptpad Nutzungsbedingungen";
      out.tos_legal = "Sei nicht bösartig, missbrauchend und mach nichts illegales.";
      out.tos_availability = "Wir hoffen, dass dir dieser Service nützt, aber Erreichbarkeit und Performanz können nicht garantiert werden. Bitte exportiere deine Daten regelmäßig.";
      out.tos_e2ee = "Cryptpad Dokumente können von allen gelesen oder bearbeitet werden, die den \"fragment identifier\" des Dokuments erraten oder auf eine andere Art davon erfahren. Wir empfehlen dir Ende-Zu-Ende verschlüsselte Nachrichtentechnik (e2ee) zum Versenden der URLs zu nutzen. Wir übernehmen keine Haftung falls eine URL erschlichen oder abgegriffen wird.";
      out.tos_logs = "Metadaten, die dein Browser bereitstellt, können geloggt werden, um den Service aufrechtzuerahlten.";
      out.tos_3rdparties = "Wir geben keine Individualdaten an dritte Weiter, außer auf richterliche Anordnung.";

      // BottomBar.html

      out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Mit <img class="bottom-bar-heart" src="/customize/heart.png" /> in <img class="bottom-bar-fr" src="/customize/fr.png" /> gemacht</a>';
      out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Ein <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> mit Hilfe von <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

      // Header.html

      out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Mit <img class="bottom-bar-heart" src="/customize/heart.png" /> von <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> und <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';


      // TODO Hardcode cause YOLO
      //out.header_xwiki = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
      out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
      out.header_logoTitle = 'Zur Hauptseite';

      return out;
  });
