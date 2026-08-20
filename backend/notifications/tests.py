from notifications.services import fa_number
def test_persian_number_format(): assert fa_number(2850000000) == "۲,۸۵۰,۰۰۰,۰۰۰"
