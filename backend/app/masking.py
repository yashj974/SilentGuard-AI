import re

def mask_credentials_in_text(text: str) -> str:
    """
    Mask passwords, JWT tokens, AWS keys, GitHub tokens, and database connection strings
    in source code and error messages before presenting to the user or writing to logs.
    """
    if not text:
        return ""

    # 1. Mask key: "value" or key = "value"
    text = re.sub(
        r"(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|jwt[_-]?secret|password|db[_-]?pass)(\s*[:=]\s*['\"])([^'\"]{3})[^'\"]+([^'\"]{3})(['\"])",
        r"\1\2\3********\4\5",
        text,
    )

    # 2. Mask unquoted env values (e.g. JWT_SECRET=abcdef123456)
    text = re.sub(
        r"(?im)^(api[_-]?key|secret[_-]?key|auth[_-]?token|jwt[_-]?secret|password|db[_-]?pass)(\s*=\s*)([a-zA-Z0-9_\-\.]{3})[a-zA-Z0-9_\-\.]+([a-zA-Z0-9_\-\.]{3})$",
        r"\1\2\3********\4",
        text,
    )

    # 3. Mask AWS Access Key IDs
    text = re.sub(r"AKIA[0-9A-Z]{16}", r"AKIA****REDACTED****", text)

    # 4. Mask GitHub Personal / OAuth tokens (ghp_, gho_, ghu_, ghs_, ghr_)
    text = re.sub(
        r"(gh[pousr]_[a-zA-Z0-9]{3})[a-zA-Z0-9]{20,}([a-zA-Z0-9]{3})",
        r"\1********\2",
        text,
    )

    # 5. Mask Database connection URLs (postgres, mysql, mongodb, redis)
    text = re.sub(
        r"(?i)\b((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis)://[^:@\s]+):[^@\s]+@",
        r"\1:********@",
        text,
    )

    # 6. Mask Google API keys (AIza...)
    text = re.sub(
        r"(AIza[0-9A-Za-z-_]{4})[0-9A-Za-z-_]{27}([0-9A-Za-z-_]{4})",
        r"\1********\2",
        text,
    )

    return text
