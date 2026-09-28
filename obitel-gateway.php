<?php
// Isolated Obitel transport. No local database, credentials or Minecraft includes.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Vary: Origin');
header('X-Content-Type-Options: nosniff');
function fail(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin !== 'https://hordeminecraft.github.io') fail(403, 'Origin not allowed');
header('Access-Control-Allow-Origin: https://hordeminecraft.github.io');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Obitel-Session');
header('Access-Control-Expose-Headers: X-Obitel-Session');
$route = $_GET['route'] ?? '';
if (!is_string($route) || !preg_match('~\A[a-z0-9-]+(?:/[a-z0-9-]+)*\z~D', $route) || strlen($route) > 120 || count($_GET) !== 1) fail(404, 'Unknown route');
$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'OPTIONS'], true)) fail(405, 'Method not allowed');
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) fail(413, 'Request too large');
$body = file_get_contents('php://input', false, null, 0, 8193);
if ($body === false || strlen($body) > 8192) fail(413, 'Request too large');
$headers = ['Origin: https://hordeminecraft.github.io', 'Accept: application/json'];
if ($method === 'POST') $headers[] = 'Content-Type: application/json';
$session = $_SERVER['HTTP_X_OBITEL_SESSION'] ?? '';
if ($session !== '') {
    if (!preg_match('/\A[a-f0-9]{32}\z/D', $session)) fail(400, 'Invalid session format');
    $headers[] = 'X-Obitel-Session: ' . $session;
}
$issued = '';
$type = '';
$curl = curl_init('https://obiteldead.deniswww127.workers.dev/api/' . $route);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HEADERFUNCTION => static function ($ch, string $line) use (&$issued, &$type): int {
        if (stripos($line, 'X-Obitel-Session:') === 0) $issued = trim(substr($line, 17));
        if (stripos($line, 'Content-Type:') === 0) $type = trim(substr($line, 13));
        return strlen($line);
    },
]);
if ($method === 'POST') curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
$response = curl_exec($curl);
$status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);
if ($response === false || $status < 200 || $status >= 500) fail(502, 'Игровой сервер временно недоступен. Повтори подключение.');
if ($status >= 300 && $status < 400) fail(502, 'Unexpected upstream redirect');
if (stripos($type, 'application/json') === false) fail(502, 'Invalid upstream response');
if (preg_match('/\A[a-f0-9]{32}\z/D', $issued)) header('X-Obitel-Session: ' . $issued);
http_response_code($status);
echo $response;
