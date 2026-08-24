
FROM maven:3.9-eclipse-temurin-25 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src src

RUN mvn clean package -DskipTests


# ==============================
# RUN STAGE
# ==============================

FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]