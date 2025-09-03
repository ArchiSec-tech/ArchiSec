<?php
/**
 * Security Scanner API Endpoint
 * Endpoint semplificato per le richieste di scansione sicurezza
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? '';

if (empty($url)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL is required']);
    exit();
}

// Valida URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL format']);
    exit();
}

// Simula scansione (in produzione qui chiameresti lo script Python)
function simulateSecurityScan($url) {
    $domain = parse_url($url, PHP_URL_HOST);
    
    // Simula i controlli di base
    $portScan = [
        'scan_type' => 'port_scan',
        'open_ports' => array_values(array_filter([80, 443, 22], function() {
            return rand(0, 100) > 60;
        })),
        'vulnerabilities' => []
    ];
    
    $sslCheck = [
        'scan_type' => 'ssl_check',
        'ssl_enabled' => rand(0, 100) > 30,
        'certificate_valid' => rand(0, 100) > 20,
        'vulnerabilities' => []
    ];
    
    // Aggiungi alcune vulnerabilità simulate
    if (count($portScan['open_ports']) > 2) {
        $portScan['vulnerabilities'][] = [
            'severity' => 'medium',
            'type' => 'Open Ports',
            'description' => 'Multiple ports are open and may pose security risks',
            'recommendation' => 'Close unnecessary ports and implement firewall rules'
        ];
    }
    
    if (!$sslCheck['ssl_enabled']) {
        $sslCheck['vulnerabilities'][] = [
            'severity' => 'high',
            'type' => 'Missing SSL',
            'description' => 'Website is not using HTTPS encryption',
            'recommendation' => 'Implement SSL/TLS certificate for secure communications'
        ];
    }
    
    $allVulns = array_merge($portScan['vulnerabilities'], $sslCheck['vulnerabilities']);
    
    return [
        'timestamp' => date('c'),
        'target' => $domain,
        'scans_performed' => [$portScan, $sslCheck],
        'vulnerabilities_found' => $allVulns,
        'recommendations' => [
            'Implement HTTPS across the entire website',
            'Configure proper security headers',
            'Regular security updates for server software',
            'Consider implementing a Web Application Firewall (WAF)'
        ],
        'security_score' => max(60, 100 - (count($allVulns) * 15))
    ];
}

// Log della richiesta (opzionale)
$logEntry = [
    'timestamp' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'url' => $url,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
];

error_log(json_encode($logEntry), 3, 'security_scan_requests.log');

// Simula tempo di elaborazione
sleep(2);

$results = simulateSecurityScan($url);

echo json_encode($results, JSON_PRETTY_PRINT);
?>
