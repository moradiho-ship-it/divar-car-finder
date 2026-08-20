from rest_framework.response import Response
from rest_framework.views import APIView

class MeView(APIView):
    def get(self, request):
        return Response({"id": request.user.id, "email": request.user.email, "name": request.user.name or request.user.get_full_name()})

