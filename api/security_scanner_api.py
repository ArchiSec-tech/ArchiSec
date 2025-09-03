#!/usr/bin/env python3
"""
Flask API Server per Security Scanner
Integra lo script security_scanner.py con il frontend web
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import logging
from datetime import datetime
import threading
import time

# Aggiungi il percorso dello script di sicurezza
sys.path.append('/home/fra/Documenti/Security Automation Script')

# Importa le classi dal security_scanner
from security_scanner import SecurityScanner, WebSecurityScanner, SecurityReportGenerator

app = Flask(__name__)
CORS(app)  # Abilita CORS per le richieste dal frontend

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Store per tracciare scansioni in corso
active_scans = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'ArchiSec Security Scanner API'
    })

@app.route('/api/scan', methods=['POST'])
def security_scan():
    """
    Endpoint principale per le scansioni di sicurezza
    Supporta sia scansioni web che di rete
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        target_url = data['url'].strip()
        scan_type = data.get('type', 'web')  # 'web' o 'network'
        
        logger.info(f"Nuova richiesta di scansione: {target_url} (tipo: {scan_type})")
        
        # Validazione URL
        if not target_url:
            return jsonify({'error': 'URL non può essere vuoto'}), 400
        
        # Normalizza URL per scansioni web
        if scan_type == 'web' and not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url
        
        # Controlla se c'è già una scansione in corso per questo URL
        scan_id = f"{target_url}_{scan_type}"
        if scan_id in active_scans:
            return jsonify({
                'error': 'Scansione già in corso per questo URL',
                'scan_id': scan_id
            }), 429
        
        # Marca scansione come attiva
        active_scans[scan_id] = {
            'started_at': datetime.now().isoformat(),
            'status': 'running'
        }
        
        try:
            if scan_type == 'web':
                results = perform_web_scan(target_url)
            else:
                results = perform_network_scan(target_url)
            
            # Log risultati
            logger.info(f"Scansione completata per {target_url}: {results.get('total_vulnerabilities', 0)} vulnerabilità trovate")
            
            # Rimuovi dalla lista scansioni attive
            if scan_id in active_scans:
                del active_scans[scan_id]
            
            return jsonify(results)
            
        except Exception as scan_error:
            logger.error(f"Errore durante la scansione di {target_url}: {scan_error}")
            
            # Rimuovi dalla lista scansioni attive
            if scan_id in active_scans:
                del active_scans[scan_id]
            
            return jsonify({
                'error': 'Errore durante la scansione',
                'details': str(scan_error),
                'target': target_url
            }), 500
        
    except Exception as e:
        logger.error(f"Errore generale nell'API: {e}")
        return jsonify({
            'error': 'Errore interno del server',
            'details': str(e)
        }), 500

def perform_web_scan(target_url):
    """
    Esegue una scansione web usando WebSecurityScanner
    """
    scanner = WebSecurityScanner(target_url)
    results = scanner.run_web_scan()
    
    # Aggiunge informazioni aggiuntive per il frontend
    results['scan_id'] = f"web_{int(time.time())}"
    results['scan_duration'] = "2-5 seconds"
    results['scanner_version'] = "ArchiSec Web Scanner v1.0"
    
    # Calcola security score basato sulle vulnerabilità
    total_vulns = results.get('total_vulnerabilities', 0)
    critical_count = results.get('critical_count', 0)
    high_count = results.get('high_count', 0)
    medium_count = results.get('medium_count', 0)
    
    # Formula per security score (0-100)
    base_score = 100
    penalty = (critical_count * 20) + (high_count * 10) + (medium_count * 5)
    security_score = max(0, min(100, base_score - penalty))
    
    results['security_score'] = security_score
    
    # Aggiunge raccomandazioni se non presenti
    if 'recommendations' not in results:
        results['recommendations'] = generate_recommendations(results)
    
    return results

def perform_network_scan(target):
    """
    Esegue una scansione di rete usando SecurityScanner
    """
    # Estrai hostname dall'URL se necessario
    if target.startswith(('http://', 'https://')):
        from urllib.parse import urlparse
        target = urlparse(target).netloc
    
    scanner = SecurityScanner(target)
    results = scanner.run_full_scan()
    
    # Converte formato per compatibilità con frontend
    formatted_results = {
        'timestamp': results.get('timestamp'),
        'target': target,
        'target_url': f"https://{target}",
        'scan_id': f"network_{int(time.time())}",
        'scans_performed': results.get('scans_performed', []),
        'vulnerabilities_found': results.get('vulnerabilities_found', []),
        'total_vulnerabilities': len(results.get('vulnerabilities_found', [])),
        'recommendations': results.get('recommendations', []),
        'security_score': calculate_network_security_score(results),
        'summary': results.get('summary', {}),
        'scanner_version': "ArchiSec Network Scanner v1.0"
    }
    
    # Aggiungi conteggi per livello di rischio
    vulns = formatted_results['vulnerabilities_found']
    formatted_results['critical_count'] = len([v for v in vulns if v.get('risk_level') == 'HIGH'])
    formatted_results['high_count'] = len([v for v in vulns if v.get('risk_level') == 'MEDIUM'])
    formatted_results['medium_count'] = len([v for v in vulns if v.get('risk_level') == 'LOW'])
    
    return formatted_results

def calculate_network_security_score(results):
    """Calcola security score per scansioni di rete"""
    vulns = results.get('vulnerabilities_found', [])
    open_ports = results.get('summary', {}).get('open_ports_count', 0)
    
    base_score = 100
    penalty = len(vulns) * 15 + open_ports * 2
    
    return max(40, min(100, base_score - penalty))

def generate_recommendations(scan_results):
    """Genera raccomandazioni basate sui risultati della scansione"""
    recommendations = [
        "Implementa HTTPS su tutto il sito web",
        "Configura intestazioni di sicurezza HTTP appropriate",
        "Mantieni aggiornati tutti i software e plugin",
        "Implementa un Web Application Firewall (WAF)"
    ]
    
    # Aggiungi raccomandazioni specifiche basate sulle vulnerabilità
    vulns = scan_results.get('vulnerabilities_found', [])
    
    has_ssl_issues = any('ssl' in v.get('type', '').lower() for v in vulns)
    has_header_issues = any('header' in v.get('type', '').lower() for v in vulns)
    has_cms_issues = any('cms' in v.get('type', '').lower() for v in vulns)
    
    if has_ssl_issues:
        recommendations.insert(0, "URGENTE: Correggi immediatamente i problemi SSL/TLS")
    
    if has_header_issues:
        recommendations.append("Configura Content Security Policy (CSP) e altri security headers")
    
    if has_cms_issues:
        recommendations.append("Aggiorna il CMS e tutti i plugin alla versione più recente")
    
    return recommendations

@app.route('/api/scan-status/<scan_id>', methods=['GET'])
def get_scan_status(scan_id):
    """Controlla lo stato di una scansione"""
    if scan_id in active_scans:
        return jsonify({
            'scan_id': scan_id,
            'status': 'running',
            'started_at': active_scans[scan_id]['started_at']
        })
    else:
        return jsonify({
            'scan_id': scan_id,
            'status': 'completed_or_not_found'
        })

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Genera un report professionale dai risultati di scansione"""
    try:
        data = request.get_json()
        
        scan_results = data.get('scan_results')
        client_info = data.get('client_info', {})
        
        if not scan_results:
            return jsonify({'error': 'Risultati scansione richiesti'}), 400
        
        # Genera report
        report_generator = SecurityReportGenerator(scan_results, client_info)
        report_filename = report_generator.save_report()
        
        return jsonify({
            'success': True,
            'report_file': report_filename,
            'message': 'Report generato con successo'
        })
        
    except Exception as e:
        logger.error(f"Errore nella generazione report: {e}")
        return jsonify({
            'error': 'Errore nella generazione del report',
            'details': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint non trovato'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Errore interno del server'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Avvio ArchiSec Security Scanner API su porta {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
