from flask import Flask, request, jsonify
from flask_restful import Api
import datetime
import sqlite3
from loguru import logger

logger.add("app_hot_list.log", format="{time:YYYY-MM-DD at HH:mm:ss} | {level} | {message}")

app = Flask(__name__)
api = Api(app)


def get_app_hot_list(query_length, before_timespan):
    now = datetime.datetime.now()
    before_time = now + datetime.timedelta(hours=-before_timespan)

    sql_str = """select
        cg.Name ApplicationName,
        sum((julianday(datetime(a.EndLocalTime))-julianday(datetime(a.StartLocalTime))))*24*60 sum_time
    from
        Ar_Activity a
    join
        Ar_CommonGroup cg on a.CommonGroupId = cg.CommonId
    join
        Ar_Timeline t on a.ReportId = t.ReportId
    join
        Ar_User u on u.UserId = t.OwnerId
    where
        t.SchemaName = 'ManicTime/Applications' and
        a.StartLocalTime > '{}' and
        a.EndLocalTime < '{}'
    group by ApplicationName
    ORDER BY sum_time desc 
    LIMIT {}""".format(before_time.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S"), query_length)

    # conn = sqlite3.connect('D:\\ManicTime-Backup\\ManicTimeReports.db')
    conn = sqlite3.connect('/root/workspace/manictimeserver/Data/ManicTimeReports.db')
    cursor = conn.cursor()

    cursor.execute(sql_str)

    values = cursor.fetchall()

    return values


@app.route('/app_hot_list', methods=['GET'])
def app_hot_list():
    try:
        query_length = int(request.args.get('query_length', None))
        before_timespan = int(request.args.get('before_timespan', None))
    except TypeError:
        logger.error("parse query err: query_length: {}, before_timespan: {}", request.args.get('query_length', None),
                     request.args.get('before_timespan', None))
        return jsonify({'data': []})

    logger.info("query_length: {}, before_timespan: {}", query_length, before_timespan)

    if query_length >= 15 or query_length <= 0:
        query_length = 15
    if before_timespan >= 24 or before_timespan <= 0:
        before_timespan = 24

    return jsonify({'data': get_app_hot_list(query_length, before_timespan)})


if __name__ == "__main__":
    from waitress import serve

    # app.run(port=18848, debug=False)
    serve(app, host="0.0.0.0", port=8080)
