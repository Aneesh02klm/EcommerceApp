using Dapper;
using System.Data;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Malieakal.Api.Database
{
    public class JsonObjectTypeHandler : SqlMapper.TypeHandler<object>
    {
        public override void SetValue(IDbDataParameter parameter, object value)
        {
            parameter.Value = JsonSerializer.Serialize(value);
            ((Npgsql.NpgsqlParameter)parameter).NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Jsonb;
        }

        public override object Parse(object value)
        {
            if (value is string json)
            {
                return JsonSerializer.Deserialize<object>(json)!;
            }
            return value;
        }
    }
}
