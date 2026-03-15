FROM ubuntu:22.04

ARG GODOT_VERSION=4.3
ARG GODOT_RELEASE=stable

ENV DEBIAN_FRONTEND=noninteractive
ENV GODOT_VERSION=${GODOT_VERSION}

# Install dependencies (fontconfig required by Godot for font handling)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fontconfig \
    git \
    jq \
    unzip \
    wget \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Download Godot headless
RUN mkdir -p /opt/godot \
    && wget -q "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-${GODOT_RELEASE}/Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64.zip" \
       -O /tmp/godot.zip \
    && unzip /tmp/godot.zip -d /opt/godot \
    && mv /opt/godot/Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_linux.x86_64 /opt/godot/godot \
    && chmod +x /opt/godot/godot \
    && rm /tmp/godot.zip \
    && ln -s /opt/godot/godot /usr/local/bin/godot

# Download export templates
RUN mkdir -p /root/.local/share/godot/export_templates/${GODOT_VERSION}.${GODOT_RELEASE} \
    && wget -q "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-${GODOT_RELEASE}/Godot_v${GODOT_VERSION}-${GODOT_RELEASE}_export_templates.tpz" \
       -O /tmp/templates.tpz \
    && unzip /tmp/templates.tpz -d /tmp/templates \
    && mv /tmp/templates/templates/* /root/.local/share/godot/export_templates/${GODOT_VERSION}.${GODOT_RELEASE}/ \
    && rm -rf /tmp/templates /tmp/templates.tpz

# Install SteamCMD
RUN echo steam steam/question select "I AGREE" | debconf-set-selections \
    && echo steam steam/license note '' | debconf-set-selections \
    && dpkg --add-architecture i386 \
    && apt-get update && apt-get install -y --no-install-recommends \
       lib32gcc-s1 steamcmd \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/games/steamcmd /usr/local/bin/steamcmd

# Install Butler (itch.io)
RUN mkdir -p /opt/butler \
    && wget -q "https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default" \
       -O /tmp/butler.zip \
    && unzip /tmp/butler.zip -d /opt/butler \
    && chmod +x /opt/butler/butler \
    && ln -s /opt/butler/butler /usr/local/bin/butler \
    && rm /tmp/butler.zip

WORKDIR /build

COPY build.sh /build/build.sh
RUN sed -i 's/\r$//' /build/build.sh && chmod +x /build/build.sh

ENTRYPOINT ["/build/build.sh"]
