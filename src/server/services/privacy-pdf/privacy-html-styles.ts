export const PRIVACY_HTML_STYLES = `
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

  .privacy-page {
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

  .privacy-page:last-child {
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
    font-size: 24px;
    font-weight: 900;
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1.25;
  }

  .sub-title {
    color: #CBD5E1;
    font-size: 13.5px;
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
    font-size: 14px;
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
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 12px;
  }

  .section-title {
    color: #14F5D5;
    font-size: 14px;
    font-weight: 800;
    border-bottom: 1px solid rgba(20, 184, 166, 0.2);
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .clause-item {
    font-size: 12px;
    color: #CBD5E1;
    line-height: 1.7;
    margin-bottom: 8px;
  }

  .clause-item b {
    color: #FFFFFF;
    font-weight: 800;
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(20, 184, 166, 0.2);
    padding-top: 10px;
    font-size: 11px;
    color: #94A3B8;
    margin-top: 10px;
  }
`;
