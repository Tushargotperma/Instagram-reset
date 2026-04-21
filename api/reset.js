const { v4: uuidv4 } = require('uuid');

async function sendResetV1(username) {
    const headers = {
        'authority': 'www.instagram.com',
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36',
        'x-csrftoken': 'MoKKhcy0MtQHyxInGtndUr',
        'x-ig-app-id': '936619743392459',
        'x-requested-with': 'XMLHttpRequest',
    };

    const data = { email_or_username: username };

    try {
        const res = await fetch('https://www.instagram.com/api/v1/web/accounts/account_recovery_send_ajax/', {
            method: 'POST',
            headers: headers,
            body: new URLSearchParams(data)
        });
        
        const json = await res.json();
        
        if (json.contact_point) {
            return { success: true, email: json.contact_point };
        }
        return { success: false, message: 'Username not found' };
    } catch (err) {
        return { success: false, message: 'Error connecting to Instagram' };
    }
}

async function sendResetV2(username) {
    const payload = {
        ig_sig_key_version: '4',
        user_email: username,
        device_id: uuidv4(),
    };

    const headers = {
        'User-Agent': 'Instagram 113.0.0.39.122 Android',
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
        const res = await fetch('https://i.instagram.com/api/v1/accounts/send_password_reset/', {
            method: 'POST',
            headers: headers,
            body: new URLSearchParams(payload)
        });
        
        const json = await res.json();
        
        if (json.obfuscated_email) {
            return { success: true, email: json.obfuscated_email };
        }
        return { success: false, message: 'Rate limit or invalid user' };
    } catch (err) {
        return { success: false, message: 'Attempt failed' };
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { username } = req.body;

    if (!username) {
        return res.json({ success: false, message: 'Username required' });
    }

    let result = await sendResetV2(username);
    
    if (!result.success) {
        result = await sendResetV1(username);
    }
    
    res.json(result);
}
