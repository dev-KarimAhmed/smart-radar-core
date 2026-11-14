export const CONTRACT_HTML_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    background-color: #070B14;
    color: #F8FAFC;
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }

  .contract-page {
    background: #0B0F19;
    border: 1.5px solid rgba(20, 184, 166, 0.45);
    border-radius: 18px;
    padding: 22px 26px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    page-break-after: always;
    min-height: 275mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .contract-page:last-child {
    page-break-after: avoid;
  }

  .header-table {
    width: 100%;
    border-bottom: 1.5px solid rgba(20, 184, 166, 0.25);
    padding-bottom: 14px;
    margin-bottom: 16px;
  }

  .badge-sovereign {
    display: inline-block;
    background: rgba(20, 184, 166, 0.15);
    border: 1px solid rgba(20, 184, 166, 0.35);
    color: #14F5D5;
    padding: 3px 12px;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .brand-title {
    color: #14F5D5;
    font-size: 26px;
    font-weight: 900;
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1.25;
  }

  .sub-title {
    color: #CBD5E1;
    font-size: 14px;
    font-weight: 700;
    margin-top: 4px;
  }

  .serial-box {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px 14px;
    text-align: left;
  }

  .serial-code {
    font-family: monospace;
    font-size: 15px;
    font-weight: 900;
    color: #14F5D5;
    direction: ltr;
    display: block;
    margin-top: 2px;
  }

  .status-active {
    color: #10B981;
    font-size: 11px;
    font-weight: 800;
    margin-top: 3px;
  }

  .section-box {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px 18px;
    margin-bottom: 14px;
  }

  .section-title {
    font-size: 15.5px;
    font-weight: 900;
    color: #14F5D5;
    margin-top: 0;
    margin-bottom: 12px;
    border-bottom: 1.5px solid rgba(20, 184, 166, 0.2);
    padding-bottom: 6px;
  }

  .info-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 6px;
    font-size: 13.5px;
  }

  .info-table tr {
    background: rgba(255, 255, 255, 0.025);
  }

  .info-table td {
    padding: 8px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .info-table td:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .info-table td:last-child {
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  .lbl {
    color: #94A3B8;
    font-weight: 700;
    white-space: nowrap;
    width: 130px;
    font-size: 13px;
  }

  .val {
    color: #F8FAFC;
    font-weight: 800;
    text-align: right;
  }

  .val-ltr {
    font-family: monospace;
    direction: ltr;
    color: #38BDF8;
    font-weight: 800;
    text-align: right;
    font-size: 13.5px;
  }

  .clause-item {
    display: flex;
    gap: 12px;
    margin-bottom: 13px;
    font-size: 14.5px;
    color: #CBD5E1;
    line-height: 1.65;
    text-align: justify;
  }

  .clause-num {
    color: #14F5D5;
    font-weight: 900;
    flex-shrink: 0;
    min-width: 20px;
    font-size: 15px;
  }

  .clause-item b {
    color: #F8FAFC;
    font-weight: 800;
  }

  .footer-box {
    background: rgba(20, 184, 166, 0.06);
    border: 1px solid rgba(20, 184, 166, 0.25);
    border-radius: 16px;
    padding: 18px 22px;
    font-size: 13.5px;
  }

  .hash-code {
    font-family: monospace;
    font-size: 12px;
    color: #14F5D5;
    direction: ltr;
    word-break: break-all;
    display: block;
    margin-top: 6px;
    background: rgba(0, 0, 0, 0.4);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(20, 184, 166, 0.2);
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;
    margin-top: 14px;
    font-size: 11.5px;
    color: #64748B;
    font-weight: 600;
  }
`;
