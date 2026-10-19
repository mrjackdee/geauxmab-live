<?php
// Fixed, public ClubExpress calendar. No visitor-supplied URLs or credentials.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
const CALENDAR_URL = 'https://omicronsigma.clubexpress.com/content.aspx?action=cira&club_id=182064&page_id=4001&sif=0&vm=Future';
function calendarEvents(string $html): array {
    if (!class_exists('DOMDocument') || !preg_match('/Future Events/i', $html)) {
        throw new RuntimeException('Calendar format unavailable');
    }
    $doc = new DOMDocument();
    $old = libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET);
    libxml_clear_errors();
    libxml_use_internal_errors($old);
    $xpath = new DOMXPath($doc);
    $events = [];
    foreach ($xpath->query('//a[@href]') as $anchor) {
        $href = html_entity_decode($anchor->getAttribute('href'), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $url = parse_url($href);
        if ($url === false || (isset($url['host']) && strtolower($url['host']) !== 'omicronsigma.clubexpress.com')) continue;
        if (!preg_match('~(?:^|/)content\.aspx$~i', $url['path'] ?? '')) continue;
        parse_str($url['query'] ?? '', $params);
        if (($params['page_id'] ?? '') !== '4002' || ($params['club_id'] ?? '') !== '182064' || !preg_match('/^[0-9]+$/', (string)($params['item_id'] ?? ''))) continue;
        $title = trim(preg_replace('/\s+/u', ' ', $anchor->textContent));
        if ($title === '' || preg_match('/^(visibility\s*)?View$/i', $title)) continue;
        $id = $params['item_id'];
        if (isset($events[$id])) continue;
        $dateLabel = '';
        // Read only the nearest enclosing event with a full date, never the whole page.
        $datePattern = '/(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?),?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+at\s+\d{1,2}:\d{2}\s*[AP]M)?/i';
        for ($node = $anchor->parentNode, $depth = 0; $node && $depth < 7; $node = $node->parentNode, $depth++) {
            if (in_array(strtolower($node->nodeName), ['body', 'html', 'form'], true)) break;
            $text = trim(preg_replace('/\s+/u', ' ', $node->textContent));
            if (preg_match_all($datePattern, $text, $dates) === 1) { $dateLabel = $dates[0][0]; break; }
        }
        $events[$id] = [
            'id' => $id,
            'title' => $title,
            'dateLabel' => $dateLabel,
            'url' => 'https://omicronsigma.clubexpress.com/content.aspx?club_id=182064&page_id=4002&item_id=' . $id,
        ];
        if (count($events) >= 40) break;
    }
    if (!$events && !preg_match('/No events scheduled in the requested time period/i', $html)) {
        throw new RuntimeException('Calendar could not be read');
    }
    return array_values($events);
}
function fetchCalendar(): string {
    if (function_exists('curl_init')) {
        $curl = curl_init(CALENDAR_URL);
        $body = '';
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12, CURLOPT_FOLLOWLOCATION => false, CURLOPT_USERAGENT => 'NorthDallasSigmas-Events/1.0', CURLOPT_WRITEFUNCTION => function ($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 2000000) return 0;
            $body .= $chunk;
            return strlen($chunk);
        }]);
        $ok = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($ok === false || $status !== 200) throw new RuntimeException('Calendar connection unavailable');
        return $body;
    }
    $context = stream_context_create(['http' => ['timeout' => 12, 'follow_location' => 0, 'user_agent' => 'NorthDallasSigmas-Events/1.0'], 'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
    $body = @file_get_contents(CALENDAR_URL, false, $context, 0, 2000001);
    if ($body === false || strlen($body) > 2000000) throw new RuntimeException('Calendar connection unavailable');
    return $body;
}
// Allows the parser to be checked with local HTML fixtures without network calls.
if (PHP_SAPI === 'cli' && isset($argv[1])) {
    echo json_encode(calendarEvents((string)file_get_contents($argv[1])), JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}
try {
    $events = calendarEvents(fetchCalendar());
    header('Cache-Control: public, max-age=300');
    echo json_encode(['status' => 'ok', 'source' => CALENDAR_URL, 'checkedAt' => gmdate('c'), 'events' => $events], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    http_response_code(502);
    header('Cache-Control: no-store');
    echo json_encode(['status' => 'unavailable', 'source' => CALENDAR_URL, 'events' => []], JSON_UNESCAPED_SLASHES);
}
