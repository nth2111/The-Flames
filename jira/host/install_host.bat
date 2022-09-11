:: Copyright 2014 The Chromium Authors. All rights reserved.
:: Use of this source code is governed by a BSD-style license that can be
:: found in the LICENSE file.

:: Change HKCU to HKLM if you want to install globally.
:: %~dp0 is the directory containing this bat script and ends with a backslash.

pip install -r requirements.txt
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.google.chrome.listener.message" /ve /t REG_SZ /d "%~dp0com.google.chrome.listener.message.json" /f
