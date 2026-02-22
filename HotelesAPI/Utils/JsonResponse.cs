namespace HotelesAPI.Utils
{
    public class JsonResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }

        public static JsonResponse Ok(string message, object? data = null)
        {
            return new JsonResponse { Success = true, Message = message, Data = data };
        }

        public static JsonResponse Error(string message)
        {
            return new JsonResponse { Success = false, Message = message, Data = null };
        }
    }
}