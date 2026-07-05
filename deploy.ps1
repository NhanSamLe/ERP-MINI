# ============================================================
#  deploy.ps1 — Deploy ERP-MINI lên EC2 chỉ với 1 lệnh
#  Cách dùng:
#    .\deploy.ps1            → deploy cả frontend + backend
#    .\deploy.ps1 -Fe        → chỉ frontend
#    .\deploy.ps1 -Be        → chỉ backend
# ============================================================
param(
    [switch]$Fe,
    [switch]$Be
)

$ErrorActionPreference = "Stop"

# --- Cấu hình (sửa nếu IP/domain đổi) ---
$EC2_IP   = "52.221.247.194"
$EC2_USER = "ec2-user"
$KEY      = "$env:USERPROFILE\Downloads\erp-key.pem"
$ROOT     = "d:\UTE_CNTT_24_25\CNPMM\TLCN_main\ERP-MINI"
# ----------------------------------------

# Mặc định: nếu không truyền cờ nào thì làm cả 2
$doFe = $Fe -or (-not $Fe -and -not $Be)
$doBe = $Be -or (-not $Fe -and -not $Be)

function Run-Ssh($cmd) {
    ssh -i $KEY -o ConnectTimeout=20 "$EC2_USER@$EC2_IP" $cmd
}

if ($doFe) {
    Write-Host "`n=== [FRONTEND] Build tren may ban ===" -ForegroundColor Cyan
    Set-Location "$ROOT\erp-frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build frontend that bai" }

    Write-Host "=== [FRONTEND] Nen + upload ===" -ForegroundColor Cyan
    Remove-Item dist.tar.gz -ErrorAction SilentlyContinue
    tar -czf dist.tar.gz -C dist .
    scp -i $KEY dist.tar.gz "${EC2_USER}@${EC2_IP}:/home/$EC2_USER/dist.tar.gz"

    Write-Host "=== [FRONTEND] Giai nen vao Nginx ===" -ForegroundColor Cyan
    Run-Ssh "rm -rf ~/dist_new && mkdir ~/dist_new && tar -xzf ~/dist.tar.gz -C ~/dist_new && sudo rm -rf /var/www/erp/* && sudo cp -r ~/dist_new/* /var/www/erp/ && sudo chown -R nginx:nginx /var/www/erp && echo 'Frontend deployed OK'"
}

if ($doBe) {
    Write-Host "`n=== [BACKEND] Pull + build + restart tren EC2 ===" -ForegroundColor Cyan
    Run-Ssh "cd ~/erp && git pull && cd erp-backend && npm install && npm run build && (npm run migrate || echo '(khong co migration moi)') && pm2 restart erp-backend && echo 'Backend deployed OK'"
}

Write-Host "`n=== XONG! Truy cap: https://erpmini.id.vn ===" -ForegroundColor Green
Set-Location $ROOT
